from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from restaurantes.models import UsuarioRestaurante
from ventas.models import Venta

from .models import ConfigImpresion
from .services import (
    LocalPrintService,
    PrinterConfigurationError,
    PrinterConnectionError,
    PrinterDependencyError,
)


def get_restaurante_usuario(user):
    relacion = UsuarioRestaurante.objects.filter(usuario=user, activo=True).select_related("restaurante").first()
    return relacion.restaurante if relacion else None


class ImprimirVentaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {"error": "Usuario no asociado a un restaurante"},
                status=status.HTTP_403_FORBIDDEN,
            )

        venta_id = request.data.get("venta_id")
        configuracion_id = request.data.get("configuracion_id")
        notas = request.data.get("notas")
        copias = request.data.get("copias")

        if not venta_id:
            return Response(
                {"error": "El campo venta_id es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            venta = (
                Venta.objects.filter(restaurante=restaurante)
                .select_related("restaurante", "pedido", "pedido__mesa", "pedido__mesero")
                .prefetch_related("detalles__producto", "detalles__comensal")
                .get(id=venta_id)
            )
        except Venta.DoesNotExist:
            return Response(
                {"error": "Venta no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        configuraciones = ConfigImpresion.objects.filter(
            restaurante=restaurante,
            activo=True,
        ).select_related("impresora")

        if configuracion_id:
            configuraciones = configuraciones.filter(id=configuracion_id)

        configuracion = configuraciones.first()

        if not configuracion:
            return Response(
                {"error": "No hay una configuración de impresión activa"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        impresora = configuracion.impresora

        if not impresora.activo:
            return Response(
                {"error": "La impresora seleccionada está desactivada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            copias_config = configuracion.copias or 1
            copias_finales = int(copias) if copias else copias_config
        except (TypeError, ValueError):
            return Response(
                {"error": "El campo copias debe ser numérico"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            servicio = LocalPrintService(impresora, configuracion)
            servicio.imprimir_ticket_venta(venta, copias=copias_finales, notas=notas)
        except PrinterDependencyError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except PrinterConfigurationError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PrinterConnectionError as exc:
            return Response(
                {"error": f"No se pudo conectar con la impresora: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "mensaje": "Ticket enviado a impresión",
                "impresora": impresora.nombre,
                "copias": copias_finales,
            },
            status=status.HTTP_200_OK,
        )


class ConfiguracionesActivasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {"error": "Usuario no asociado a un restaurante"},
                status=status.HTTP_403_FORBIDDEN,
            )

        configuraciones = (
            ConfigImpresion.objects.filter(restaurante=restaurante, activo=True)
            .select_related("impresora")
            .order_by("tipo_comprobante", "impresora__nombre")
        )

        resultado = [
            {
                "id": config.id,
                "tipo_comprobante": config.tipo_comprobante,
                "copias": config.copias,
                "opciones": config.opciones,
                "impresora": {
                    "id": config.impresora_id,
                    "nombre": config.impresora.nombre,
                    "tipo_conexion": config.impresora.tipo_conexion,
                    "activo": config.impresora.activo,
                },
            }
            for config in configuraciones
        ]

        return Response(
            {
                "tiene_configuracion": bool(resultado),
                "configuraciones": resultado,
            }
        )
