import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PanelVentas from '../components/PanelVentas';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  X,
  CheckCircle,
  Printer
} from "lucide-react";
import { printOrDownloadTicket } from '../lib/printFlow';
import { formatCurrency } from '../lib/ticketPrinter';
import { obtenerNombreRestauranteLocal } from '../lib/restaurante';


export default function CuentaRapida({ onCancelar, onVentaExitosa }) {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [modoRapido, setModoRapido] = useState(true);

  // Estados para pago
  const [dialogPago, setDialogPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [dialogExito, setDialogExito] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [impresionEnCurso, setImpresionEnCurso] = useState(false);
  const restauranteNombre = obtenerNombreRestauranteLocal();

  const ejecutarImpresionTicket = useCallback(async ({ ventaId, ticketData }) => {
    setImpresionEnCurso(true);
    try {
      const resultado = await printOrDownloadTicket({
        ventaId,
        ticketData,
      });

      if (resultado.resultado === 'impreso') {
        Swal.fire({
          icon: 'success',
          title: 'Ticket enviado',
          text: 'Se envió el ticket a la impresora configurada.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Ticket descargado',
          text: resultado.mensaje || 'No hay impresora configurada. Se descargó el PDF del ticket.',
          confirmButtonColor: '#f97316'
        });
      }
    } catch (error) {
      console.error('Error al intentar imprimir ticket rápido:', error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo imprimir',
        text: 'Intenta nuevamente o utiliza el PDF descargado.',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setImpresionEnCurso(false);
    }
  }, []);

  const ofrecerImpresionTicket = useCallback(async ({ ventaId, ticketData }) => {
    const resultado = await Swal.fire({
      icon: 'question',
      title: '¿Imprimir ticket ahora?',
      text: 'Puedes enviarlo a la impresora configurada o descargarlo en PDF.',
      showCancelButton: true,
      confirmButtonText: 'Imprimir ticket',
      cancelButtonText: 'Más tarde',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
    });

    if (resultado.isConfirmed) {
      await ejecutarImpresionTicket({ ventaId, ticketData });
    }
  }, [ejecutarImpresionTicket]);

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  useEffect(() => {
    if (!dialogExito) {
      setUltimaVenta(null);
    }
  }, [dialogExito]);
    
    

  const cargarCategorias = async () => {
    try {
      const res = await api.get('/productos/categorias/');
      setCategorias(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setCategorias([]);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/');
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    }
  };


  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    const itemExistente = carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: cantidad }]);
    }

    Swal.fire({
      icon: 'success',
      title: 'Agregado',
      text: `${producto.nombre} agregado al carrito`,
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });

  }, [carrito]);

  useEffect(() => {
    let timeout;

    const handleKeyDown = (e) => {
      if (timeout) clearTimeout(timeout);

      if (e.key === 'Enter') {
        if (barcode.length > 3) {
          const producto = productos.find(
            p => p.codigo_barras === barcode
          );

          if (producto) {
            agregarAlCarrito(producto, 1);
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'No encontrado',
              text: 'Producto no registrado'
            });
          }
        }
        setBarcode('');
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        setBarcode(prev => prev + e.key);
        timeout = setTimeout(() => setBarcode(''), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcode, productos, agregarAlCarrito]);

  const incrementarCantidad = (productoId) => {
    setCarrito(carrito.map(item =>
      item.id === productoId
        ? { ...item, cantidad: item.cantidad + 1 }
        : item
    ));
  };

  const decrementarCantidad = (productoId) => {
    setCarrito(carrito.map(item =>
      item.id === productoId && item.cantidad > 1
        ? { ...item, cantidad: item.cantidad - 1 }
        : item
    ).filter(item => item.cantidad > 0));
  };

  const removerDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.id !== productoId));
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const calcularCambio = () => {
    const pago = parseFloat(montoPagado) || 0;
    return pago - calcularTotal();
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = busqueda === '' || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideCategoria = categoriaSeleccionada === null || 
      p.categoria === categoriaSeleccionada;
    
    return coincideBusqueda && coincideCategoria;
  });

  const agregarProductoAlPedido = (producto, cantidad = 1) => {
    agregarAlCarrito(producto , cantidad);
  };

  const abrirDialogPago = () => {
    if (carrito.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega productos antes de procesar el pago',
        confirmButtonColor: '#f97316'
      });
      return;
    }
    setMontoPagado(calcularTotal().toFixed(2));
    setDialogPago(true);
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Agrega productos antes de procesar el pago',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    if (metodoPago === 'efectivo' && calcularCambio() < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto insuficiente',
        text: 'El monto pagado es insuficiente',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    setProcesando(true);
    try {
      const detalles = carrito.map(item => ({
        producto: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }));

      const ventaData = {
        total: calcularTotal(),
        metodo_pago: metodoPago,
        detalles: detalles
      };

      const respuesta = await api.post('/ventas/', ventaData);
      const ventaCreada = respuesta?.data || {};

      const ticketItems = carrito.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }));

      const totalVenta = ventaCreada.total ?? ventaData.total;
      const ticketPayload = {
        numeroTicket: ventaCreada.id,
        fecha: ventaCreada.created_at || new Date().toISOString(),
        negocio: restauranteNombre,
        mesa: null,
        comensal: null,
        metodoPago: ventaCreada.metodo_pago ?? metodoPago,
        items: ticketItems,
        total: totalVenta,
      };

      setUltimaVenta({
        id: ventaCreada.id,
        total: totalVenta,
        metodo_pago: ventaCreada.metodo_pago ?? metodoPago,
        fecha: ticketPayload.fecha,
        ticket: ticketPayload,
      });

      setDialogPago(false);
      setDialogExito(true);
      setCarrito([]);
      setMontoPagado('');
      setMetodoPago('efectivo');
      await ofrecerImpresionTicket({
        ventaId: ventaCreada.id,
        ticketData: ticketPayload,
      });
      if (onVentaExitosa) {
        onVentaExitosa();
      }

    } catch (error) {
      console.error('Error procesando venta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al procesar la venta',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimirTicket = async () => {
    if (!ultimaVenta?.ticket) {
      Swal.fire({
        icon: 'warning',
        title: 'Ticket no disponible',
        text: 'Procesa una venta antes de intentar imprimir.',
        confirmButtonColor: '#f97316'
      });
      return;
    }
    await ejecutarImpresionTicket({
      ventaId: ultimaVenta.id,
      ticketData: ultimaVenta.ticket,
    });
  };

  return (
    <div className="h-[calc(100vh-80px)] gap-4 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cuenta Rápida</h2>
          <p className="text-sm text-gray-600">Selecciona productos y cobra directamente</p>
        </div>
        <Button onClick={onCancelar} variant="outline">
          <X className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      <PanelVentas
        categorias={categorias}
        productos={productos}
        categoriaSeleccionada={categoriaSeleccionada}
        setCategoriaSeleccionada={setCategoriaSeleccionada}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        carrito={carrito}
        incrementarCantidad={incrementarCantidad}
        decrementarCantidad={decrementarCantidad}
        removerDelCarrito={removerDelCarrito}
        calcularTotal={calcularTotal}
        onProcesarPago={abrirDialogPago}
        modoRapido={modoRapido}
        setModoRapido={setModoRapido}
        agregarProductoAlPedido={agregarProductoAlPedido}
        productosFiltrados={productosFiltrados}
        botonPagoTexto="Procesar Pago"
      />

      {/* Dialog de Pago */}
      <Dialog open={dialogPago} onOpenChange={setDialogPago}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Revisa el monto a cobrar y confirma el método de pago para completar la venta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total a pagar */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600">Total a pagar</p>
              <p className="text-3xl font-bold text-orange-600">
                ${calcularTotal().toFixed(2)}
              </p>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('efectivo')}
                  className={metodoPago === 'efectivo' ? 'bg-orange-500' : ''}
                >
                  💵 Efectivo
                </Button>
                <Button
                  type="button"
                  variant={metodoPago === 'tarjeta' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('tarjeta')}
                  className={metodoPago === 'tarjeta' ? 'bg-orange-500' : ''}
                >
                  💳 Tarjeta
                </Button>
              </div>
            </div>

            {/* Monto pagado (solo efectivo) */}
            {metodoPago === 'efectivo' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monto recibido
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                {/* Cambio */}
                {montoPagado && (
                  <div className={`p-4 rounded-lg ${calcularCambio() >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-sm text-gray-600">Cambio</p>
                    <p className={`text-2xl font-bold ${calcularCambio() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(calcularCambio()).toFixed(2)}
                      {calcularCambio() < 0 && ' (insuficiente)'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Botones */}
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogPago(false)}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button 
                onClick={procesarVenta}
                className="bg-green-600 hover:bg-green-700"
                disabled={procesando || (metodoPago === 'efectivo' && calcularCambio() < 0)}
              >
                {procesando ? 'Procesando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Éxito */}
      <Dialog open={dialogExito} onOpenChange={setDialogExito}>
        <DialogContent className="sm:max-w-md">
          <div className="py-6 space-y-4 text-center">
            <DialogHeader className="space-y-4 text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  ¡Pago Exitoso!
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  La venta se procesó correctamente.
                </DialogDescription>
              </div>
            </DialogHeader>

            {ultimaVenta?.ticket && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Total cobrado:
                  <span className="font-semibold text-gray-800 ml-1">
                    {formatCurrency(ultimaVenta.ticket.total)}
                  </span>
                </p>
                <p>Método de pago: {ultimaVenta.ticket.metodoPago}</p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleImprimirTicket}
                disabled={impresionEnCurso}
              >
                {impresionEnCurso ? (
                  'Verificando impresora...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir ticket
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDialogExito(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
