import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PanelVentas from '../components/PanelVentas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  X,
  CheckCircle
} from "lucide-react";


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

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);
    
    

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

      await api.post('/ventas/', ventaData);
      
      setDialogPago(false);
      setDialogExito(true);
      
      setTimeout(() => {
        setDialogExito(false);
        setCarrito([]);
        setMontoPagado('');
        setMetodoPago('efectivo');
        if (onVentaExitosa) onVentaExitosa();
      }, 2000);

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

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
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
          <div className="text-center py-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Pago Exitoso!
            </h3>
            <p className="text-gray-600">
              La venta se ha procesado correctamente
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
