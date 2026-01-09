import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  X,
  DollarSign,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle
} from "lucide-react";

export default function CuentaRapida({ onCancelar, onVentaExitosa }) {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [expandidos, setExpandidos] = useState({});
  const [carrito, setCarrito] = useState([]);

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

  const toggleCategoria = (categoriaId) => {
    setExpandidos(prev => ({
      ...prev,
      [categoriaId]: !prev[categoriaId]
    }));
  };

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
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
  };

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

      <div className="flex-1 flex overflow-hidden">
        {/* Panel de productos */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* Búsqueda y filtros */}
          <div className="p-4 bg-white border-b">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                size="sm"
                variant={categoriaSeleccionada === null ? 'default' : 'outline'}
                onClick={() => setCategoriaSeleccionada(null)}
                className={categoriaSeleccionada === null ? 'bg-orange-500' : ''}
              >
                Todos
              </Button>
              {categorias.map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={categoriaSeleccionada === cat.id ? 'default' : 'outline'}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={categoriaSeleccionada === cat.id ? 'bg-orange-500' : ''}
                >
                  {cat.nombre}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de productos agrupados por categoría */}
          <div className="flex-1 overflow-auto p-4">
            {categorias.map(categoria => {
              const productosCategoria = productosFiltrados.filter(p => p.categoria === categoria.id);
              if (productosCategoria.length === 0) return null;

              return (
                <Card key={categoria.id} className="mb-4">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors p-3"
                    onClick={() => toggleCategoria(categoria.id)}
                  >
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{categoria.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">({productosCategoria.length})</span>
                        {expandidos[categoria.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  {expandidos[categoria.id] && (
                    <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {productosCategoria.map(producto => (
                        <div
                          key={producto.id}
                          onClick={() => agregarAlCarrito(producto)}
                          className="p-3 bg-white border rounded-lg hover:border-orange-500 hover:shadow-md cursor-pointer transition-all"
                        >
                          <h4 className="font-semibold text-gray-800 mb-1">{producto.nombre}</h4>
                          {producto.descripcion && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {producto.descripcion}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-orange-600">
                              ${producto.precio}
                            </span>
                            <span className="text-xs text-gray-500">
                              Stock: {producto.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Productos sin categoría o cuando hay búsqueda */}
            {(busqueda || categoriaSeleccionada !== null) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {productosFiltrados.map(producto => (
                  <div
                    key={producto.id}
                    onClick={() => agregarAlCarrito(producto)}
                    className="p-3 bg-white border rounded-lg hover:border-orange-500 hover:shadow-md cursor-pointer transition-all"
                  >
                    <h4 className="font-semibold text-gray-800 mb-1">{producto.nombre}</h4>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-orange-600">
                        ${producto.precio}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {producto.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de carrito */}
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              Carrito ({carrito.reduce((sum, item) => sum + item.cantidad, 0)} items)
            </h3>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="w-16 h-16 mb-3" />
                <p className="text-center">Carrito vacío<br />Agrega productos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-gray-800 flex-1">
                        {item.nombre}
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removerDelCarrito(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decrementarCantidad(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.cantidad}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => incrementarCantidad(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <span className="font-bold text-orange-600">
                        ${(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total y botón de pago */}
          <div className="p-4 border-t bg-gray-50">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal:</span>
                <span>${calcularTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-800">
                <span>Total:</span>
                <span className="text-orange-600">${calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={abrirDialogPago}
              disabled={carrito.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Procesar Pago
            </Button>
          </div>
        </div>
      </div>

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
