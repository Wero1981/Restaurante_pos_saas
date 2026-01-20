import logging
from contextlib import contextmanager
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Iterable, Optional

from django.utils import timezone

from ventas.models import Venta

from .models import ConfigImpresion, Impresora

try:
    from escpos.exceptions import EscposException
    from escpos.printer import Dummy, File, Network, Serial, Usb
except ImportError:  # pragma: no cover - dependency is optional at runtime
    EscposException = None  # type: ignore
    Dummy = File = Network = Serial = Usb = None  # type: ignore


ESC_POS_ERRORS = (OSError,) if EscposException is None else (OSError, EscposException)


logger = logging.getLogger(__name__)


class PrinterDependencyError(RuntimeError):
    """Raised when python-escpos is not available."""


class PrinterConfigurationError(ValueError):
    """Raised when the printer configuration is incomplete or invalid."""


class PrinterConnectionError(RuntimeError):
    """Raised when the printer cannot be reached."""


@dataclass
class PrinterContext:
    printer: Any

    def __enter__(self):
        return self.printer

    def __exit__(self, exc_type, exc, tb):
        close = getattr(self.printer, "close", None)
        if callable(close):
            try:
                close()
            except Exception:  # pragma: no cover - defensive cleanup
                logger.debug("Error closing printer", exc_info=True)
        return False


class EscposPrinterAdapter:
    """Factory that instantiates ESC/POS printer drivers from Impresora settings."""

    def __init__(self, impresora: Impresora):
        self.impresora = impresora

    def _ensure_dependency(self):
        if Usb is None:
            raise PrinterDependencyError(
                "python-escpos no disponible. Instala 'python-escpos' y 'pyusb'."
            )

    def _config(self) -> Dict[str, Any]:
        return self.impresora.configuracion or {}

    def _build_usb(self) -> Any:
        cfg = self._config()
        try:
            vendor_id = int(str(cfg["vendor_id"]), 0)
            product_id = int(str(cfg["product_id"]), 0)
        except KeyError as exc:  # pragma: no cover - validated via API
            raise PrinterConfigurationError("Vendor/Product ID requeridos para USB") from exc
        except ValueError as exc:
            raise PrinterConfigurationError("Vendor/Product ID inválidos para USB") from exc

        interface = int(str(cfg.get("interface", 0)))
        in_ep = int(str(cfg.get("in_endpoint", 0x82)))
        out_ep = int(str(cfg.get("out_endpoint", 0x01)))

        return Usb(
            vendor_id,
            product_id,
            interface=interface,
            in_ep=in_ep,
            out_ep=out_ep,
            timeout=cfg.get("timeout", 0)
        )

    def _build_network(self) -> Any:
        cfg = self._config()
        host = cfg.get("host")
        if not host:
            raise PrinterConfigurationError("Host requerido para impresora de red")
        port = int(str(cfg.get("port", 9100)))
        timeout = float(cfg.get("timeout", 5))
        return Network(host, port=port, timeout=timeout)

    def _build_serial(self) -> Any:
        cfg = self._config()
        device = cfg.get("device") or cfg.get("port")
        if not device:
            raise PrinterConfigurationError("Puerto requerido para impresora serial")
        baudrate = int(str(cfg.get("baudrate", 19200)))
        bytesize = int(str(cfg.get("bytesize", 8)))
        parity = cfg.get("parity", "N")
        stopbits = int(str(cfg.get("stopbits", 1)))
        timeout = float(cfg.get("timeout", 1))
        return Serial(
            dev=device,
            baudrate=baudrate,
            bytesize=bytesize,
            parity=parity,
            stopbits=stopbits,
            timeout=timeout,
        )

    def _build_file(self) -> Any:
        cfg = self._config()
        path = cfg.get("path", "/tmp/impresion-pos.txt")
        return File(devfile=path)

    @contextmanager
    def get_printer(self) -> Iterable[Any]:
        self._ensure_dependency()
        try:
            if self.impresora.tipo_conexion == Impresora.TipoConexion.USB:
                instancia = self._build_usb()
            elif self.impresora.tipo_conexion == Impresora.TipoConexion.RED:
                instancia = self._build_network()
            elif self.impresora.tipo_conexion == Impresora.TipoConexion.SERIAL:
                instancia = self._build_serial()
            elif self.impresora.tipo_conexion == Impresora.TipoConexion.ARCHIVO:
                instancia = self._build_file()
            else:  # pragma: no cover - defensive path
                raise PrinterConfigurationError("Tipo de conexión no soportado")

            with PrinterContext(instancia) as printer:
                yield printer
        except ESC_POS_ERRORS as exc:
            raise PrinterConnectionError(str(exc)) from exc


class VentaTicketRenderer:
    """Genera comandos ESC/POS para imprimir el ticket de una venta."""

    def __init__(self, venta: Venta, configuracion: Optional[ConfigImpresion] = None):
        self.venta = venta
        self.configuracion = configuracion

    def _opcion(self, nombre: str, default: Any = None) -> Any:
        if not self.configuracion:
            return default
        opciones = self.configuracion.opciones or {}
        return opciones.get(nombre, default)

    @staticmethod
    def _format_currency(valor: Decimal) -> str:
        valor = valor or Decimal("0.00")
        return "$ {0:,.2f}".format(valor)

    def _emit_encabezado(self, printer: Any):
        titulo = (self.configuracion.titulo or "").strip() if self.configuracion else ""
        if titulo:
            printer.set(align="center", width=2, height=2, bold=True)
            printer.text(f"{titulo}\n")
        else:
            nombre = getattr(self.venta.restaurante, "nombre", "")
            if nombre:
                printer.set(align="center", width=2, height=2, bold=True)
                printer.text(f"{nombre}\n")

        if self.configuracion and self.configuracion.encabezado:
            printer.set(align="center", width=1, height=1, bold=False)
            for linea in self.configuracion.encabezado.strip().splitlines():
                if linea.strip():
                    printer.text(f"{linea.strip()}\n")

    def _emit_detalles(self, printer: Any):
        printer.set(align="left", width=1, height=1, bold=True)
        printer.text("\nDETALLES\n")
        printer.text("-" * 32 + "\n")
        mostrar_comensal = bool(self._opcion("mostrar_comensal", False))

        detalles = self.venta.detalles.select_related("producto", "comensal").all()
        for detalle in detalles:
            nombre_producto = detalle.producto.nombre if detalle.producto else "Producto"
            linea_producto = nombre_producto[:32]
            printer.set(align="left", bold=True)
            printer.text(f"{linea_producto}\n")

            printer.set(align="left", bold=False)
            cantidad = Decimal(detalle.cantidad)
            precio = Decimal(detalle.precio_unitario)
            subtotal = Decimal(detalle.subtotal)
            info_linea = f" {cantidad} x {self._format_currency(precio)}  =  {self._format_currency(subtotal)}"
            printer.text(f"{info_linea}\n")

            if mostrar_comensal and detalle.comensal:
                printer.text(f"   Comensal: {detalle.comensal.nombre}\n")

        printer.text("-" * 32 + "\n")

    def _emit_totales(self, printer: Any):
        printer.set(align="right", width=1, height=1, bold=True)
        printer.text(f"TOTAL: {self._format_currency(Decimal(self.venta.total))}\n")
        if getattr(self.venta, "metodo_pago", None):
            printer.set(bold=False)
            printer.text(f"Pago: {self.venta.metodo_pago}\n")

    def _emit_pie(self, printer: Any, notas: Optional[str]):
        printer.set(align="center", bold=False)
        if notas:
            printer.text("\n")
            for linea in notas.splitlines():
                printer.text(f"{linea.strip()}\n")
        if self.configuracion and self.configuracion.pie_pagina:
            printer.text("\n")
            for linea in self.configuracion.pie_pagina.strip().splitlines():
                printer.text(f"{linea.strip()}\n")

    def render(self, printer: Any, notas: Optional[str] = None):
        fecha = timezone.localtime(self.venta.created_at)
        printer.set(align="left", bold=False)

        self._emit_encabezado(printer)

        mesa = getattr(self.venta.pedido, "mesa", None)
        mesero = getattr(self.venta.pedido, "mesero", None)
        printer.text("\n")
        printer.text(f"Fecha: {fecha.strftime('%d/%m/%Y %H:%M')}\n")
        if mesa:
            printer.text(f"Mesa: {getattr(mesa, 'nombre', mesa.id)}\n")
        if mesero:
            printer.text(f"Mesero: {mesero.get_full_name() or mesero.username}\n")
        printer.text(f"Venta: #{self.venta.id}\n")

        self._emit_detalles(printer)
        self._emit_totales(printer)
        self._emit_pie(printer, notas)

        if bool(self._opcion("corte_automatico", True)):
            cortar = getattr(printer, "cut", None)
            if callable(cortar):
                cortar()


class LocalPrintService:
    """Servicio que envía trabajos de impresión a una impresora ESC/POS local."""

    def __init__(self, impresora: Impresora, configuracion: Optional[ConfigImpresion] = None):
        self.impresora = impresora
        self.configuracion = configuracion
        self.adapter = EscposPrinterAdapter(impresora)

    def imprimir_ticket_venta(
        self,
        venta: Venta,
        *,
        copias: int = 1,
        notas: Optional[str] = None,
    ) -> None:
        if copias < 1:
            raise ValueError("El número de copias debe ser mayor o igual a 1")

        renderer = VentaTicketRenderer(venta, self.configuracion)

        with self.adapter.get_printer() as printer:
            for _ in range(copias):
                renderer.render(printer, notas=notas)
                printer.text("\n\n")
                if hasattr(printer, "closeDoc"):
                    try:
                        printer.closeDoc()
                    except Exception:  # pragma: no cover - impresoras especiales
                        logger.debug("Error cerrando documento ESC/POS", exc_info=True)

        logger.info(
            "Ticket enviado a impresora %s (copias=%s, venta_id=%s)",
            self.impresora.nombre,
            copias,
            venta.id,
        )
