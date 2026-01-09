import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronRight, ChevronDown, Plus, Search, Users, Send, X, ArrowLeft, Receipt, Folder, List } from "lucide-react";

export default function Pedido() {
  const navigate = useNavigate();
  const { 
    mesaSeleccionada, 
    pedidoActivo, 
    comensalSeleccionado, 
    seleccionarComensal,
    limpiarComensal,
    resetearPOS 
  } = usePOS();

  const [comensales, setComensales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [expandidos, setExpandidos] = useState({});
  const [detallesPedido, setDetallesPedido] = useState([]);
  
  // Dialogs
  const [dialogComensal, setDialogComensal] = useState(false);
  const [numeroComensales, setNumeroComensales] = useState(1);
  const [dialogProducto, setDialogProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [observacionesProducto, setObservacionesProducto] = useState('');

  useEffect(() => {
    if (!mesaSeleccionada || !pedidoActivo) {
      navigate('/mesas');
      return;
    }
    cargarCategorias();
    cargarProductos();
    cargarComensales();
    // Solo cargar detalles si pedidoActivo tiene ID
    if (pedidoActivo?.id) {
      cargarDetallesPedido();
    }
  }, [mesaSeleccionada, pedidoActivo, navigate]);

  const cargarComensales = async () => {
    if (!mesaSeleccionada) return;
    try {
      const res = await api.get(`/comensales/?mesa=${mesaSeleccionada.id}`);
      setComensales(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando comensales:', error);
      setComensales([]);
    }
  };

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

  const cargarDetallesPedido = async () => {
    if (!pedidoActivo?.id) {
      console.log('No hay pedido activo para cargar detalles');
      return;
    }
    try {
      const res = await api.get(`/pedidos/${pedidoActivo.id}/detalles/`);
      setDetallesPedido(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando detalles del pedido:', error);
      setDetallesPedido([]);
    }
  };

  const agregarComensal = async (e) => {
    e.preventDefault();
    try {
      const nuevosComensales = [];
      for (let i = 1; i <= numeroComensales; i++) {
        const numero = comensales.length + i;
        const res = await api.post('/comensales/', {
          mesa: mesaSeleccionada.id,
          nombre: `Comensal ${numero}`
        });
        nuevosComensales.push(res.data);
      }
      setComensales([...comensales, ...nuevosComensales]);
      setNumeroComensales(1);
      setDialogComensal(false);
    } catch (error) {
      console.error('Error agregando comensales:', error);
      alert('Error al agregar comensales');
    }
  };

  const agregarProductoAlPedido = (producto) => {
    if (!comensalSeleccionado) {
      alert('Por favor selecciona un comensal primero');
      return;
    }
    
    // Solo pedir cantidad si es unidad de peso
    const esUnidadPeso = ['kilogramo', 'gramo'].includes(producto.precio_por_unidad);
    
    if (esUnidadPeso) {
      setProductoSeleccionado(producto);
      setCantidadProducto(0.1); // Valor inicial más apropiado para peso
      setObservacionesProducto('');
      setDialogProducto(true);
    } else {
      // Agregar directamente con cantidad 1
      agregarDirectamente(producto, 1);
    }
  };

  const agregarDirectamente = async (producto, cantidad, observaciones = '') => {
    try {
      await api.post('/pedidos/agregar-producto/', {
        pedido_id: pedidoActivo.id,
        producto_id: producto.id,
        cantidad: cantidad,
        comensal_id: comensalSeleccionado.id,
        observaciones: observaciones
      });
      cargarDetallesPedido();
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar producto al pedido');
    }
  };

  const confirmarAgregarProducto = async () => {
    try {
      await api.post('/pedidos/agregar-producto/', {
        pedido_id: pedidoActivo.id,
        producto_id: productoSeleccionado.id,
        cantidad: cantidadProducto,
        comensal_id: comensalSeleccionado.id,
        observaciones: observacionesProducto
      });
      cargarDetallesPedido();
      setDialogProducto(false);
      setProductoSeleccionado(null);
      setCantidadProducto(1);
      setObservacionesProducto('');
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar producto al pedido');
    }
  };

  const enviarACocina = async () => {
    try {
      const pendientes = detallesPedido.filter(d => d.enviado_cocina !== true);
      console.log(detallesPedido);
      if (pendientes.length === 0) {
        alert('No hay productos pendientes para enviar a cocina');
        return;
      }

      await api.post('/pedidos/enviar-cocina/', {
        pedido_id: pedidoActivo.id
      });
      
      alert('Productos enviados a cocina exitosamente');
      cargarDetallesPedido();
    } catch (error) {
      console.error('Error enviando a cocina:', error);
      alert('Error al enviar productos a cocina');
    }
  };

  const toggleExpanded = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderArbolCategorias = (cats, level = 0) => {
    return cats.map(cat => (
      <div key={cat.id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          onClick={() => setCategoriaSeleccionada(cat.id)}
          className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer ${
            categoriaSeleccionada === cat.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
          }`}
        >
          {cat.subcategorias && cat.subcategorias.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(cat.id);
              }}
              className="hover:bg-gray-200 rounded p-1"
            >
              {expandidos[cat.id] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {(!cat.subcategorias || cat.subcategorias.length === 0) && (
            <span className="w-6"></span>
          )}
          <Folder className="w-4 h-4 text-orange-500" />
          <span className="flex-1 font-medium text-sm">{cat.nombre}</span>
        </div>
        {expandidos[cat.id] && cat.subcategorias && renderArbolCategorias(cat.subcategorias, level + 1)}
      </div>
    ));
  };

  const productosFiltrados = (Array.isArray(productos) ? productos : []).filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaSeleccionada || p.categoria === categoriaSeleccionada;
    return matchBusqueda && matchCategoria && p.activo;
  });

  // Agrupar detalles por comensal
  const detallesPorComensal = detallesPedido.reduce((acc, detalle) => {
    const comensalId = detalle.comensal?.id || 'sin-asignar';
    if (!acc[comensalId]) {
      acc[comensalId] = {
        comensal: detalle.comensal,
        items: []
      };
    }
    acc[comensalId].items.push(detalle);
    return acc;
  }, {});

  const calcularTotalPedido = () => {
    return detallesPedido.reduce((sum, detalle) => sum + parseFloat(detalle.subtotal || 0), 0);
  };

  const volverAMesas = () => {
    if (confirm('¿Deseas volver a la lista de mesas? Los cambios no enviados a cocina se perderán.')) {
      resetearPOS();
      navigate('/mesas');
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={volverAMesas}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                <Receipt className="inline-block w-8 h-8 text-orange-500 mr-3" />
                Mesa {mesaSeleccionada?.nombre || mesaSeleccionada?.numero}
              </h2>
              <p className="text-gray-600 mt-1">Pedido #{pedidoActivo?.id}</p>
            </div>
          </div>
          <Button onClick={enviarACocina} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />
            Enviar a Cocina
          </Button>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Panel Izquierdo - Comensales y Categorías */}
        <div className="w-64 flex flex-col gap-4">
          {/* Selector de Comensales */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Comensales</h3>
                <Button
                  size="sm"
                  onClick={() => setDialogComensal(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {comensales.map(comensal => (
                  <button
                    key={comensal.id}
                    onClick={() => seleccionarComensal(comensal)}
                    className={`w-full p-2 rounded-lg text-left text-sm transition-colors ${
                      comensalSeleccionado?.id === comensal.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-3 h-3 inline mr-2" />
                    {comensal.nombre}
                  </button>
                ))}
                {comensales.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No hay comensales
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categorías */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-bold text-sm mb-3">Categorías</h3>
              <div
                onClick={() => setCategoriaSeleccionada(null)}
                className={`flex items-center gap-2 p-2 mb-2 hover:bg-gray-100 rounded cursor-pointer ${
                  !categoriaSeleccionada ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                }`}
              >
                <List className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Todos</span>
              </div>
              <div className="flex-1 overflow-y-auto border-t pt-2">
                {renderArbolCategorias(categorias.filter(c => !c.parent))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Central - Productos */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {productosFiltrados.map(producto => {
                  const stock = parseFloat(producto.stock);
                  const tieneStock = stock > 0 || stock === -1;
                  const sinStock = stock <= 0 && stock !== -1;
                  
                  return (
                    <button
                      key={producto.id}
                      onClick={() => agregarProductoAlPedido(producto)}
                      disabled={!comensalSeleccionado || sinStock}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        comensalSeleccionado && tieneStock
                          ? 'border-gray-200 hover:border-orange-500 hover:shadow-md cursor-pointer'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <h4 className="font-semibold text-sm mb-1">{producto.nombre}</h4>
                      {producto.descripcion && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{producto.descripcion}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-orange-600">
                          ${parseFloat(producto.precio).toFixed(2)}
                        </span>
                        {sinStock && (
                          <span className="text-xs text-red-600 font-medium">Sin stock</span>
                        )}
                        {stock === -1 && (
                          <span className="text-xs text-green-600 font-medium">∞</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel Derecho - Ticket por Comensal */}
        <Card className="w-80 flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <h3 className="font-bold text-lg mb-4">Ticket del Pedido</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {Object.keys(detallesPorComensal).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Receipt className="w-12 h-12 mb-2" />
                  <p className="text-sm text-center">No hay productos en el pedido</p>
                </div>
              ) : (
                Object.entries(detallesPorComensal).map(([comensalId, grupo]) => (
                  <div key={comensalId} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-sm">
                        {grupo.comensal?.nombre || 'Sin asignar'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {grupo.items.map(detalle => (
                        <div key={detalle.id} className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <p className="font-medium">{detalle.producto.nombre}</p>
                            <p className="text-gray-600">
                              {detalle.cantidad}x ${parseFloat(detalle.precio_unitario).toFixed(2)}
                            </p>
                            {detalle.observaciones && (
                              <p className="text-orange-600 text-xs italic mt-1">
                                📝 {detalle.observaciones}
                              </p>
                            )}
                            {detalle.enviado_cocina === true && (
                              <span className="text-green-600 text-xs">✓ En cocina</span>
                            )}
                          </div>
                          <span className="font-semibold">
                            ${parseFloat(detalle.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-between text-sm font-semibold">
                      <span>Subtotal:</span>
                      <span>${grupo.items.reduce((sum, d) => sum + parseFloat(d.subtotal), 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
              </div>

              {detallesPedido.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-xl">Total:</span>
                  <span className="font-bold text-2xl text-orange-600">
                    ${calcularTotalPedido().toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {detallesPedido.filter(d => d.enviado_cocina === true).length} de {detallesPedido.length} en cocina
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Cantidad de Producto */}
      <Dialog open={dialogProducto} onOpenChange={setDialogProducto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              {productoSeleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Precio unitario:</span>
                <span className="font-semibold">${parseFloat(productoSeleccionado?.precio || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comensal:</span>
                <span className="font-semibold text-orange-600">{comensalSeleccionado?.nombre}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Cantidad {productoSeleccionado?.precio_por_unidad === 'kilogramo' ? '(kg)' : productoSeleccionado?.precio_por_unidad === 'gramo' ? '(gramos)' : ''}
              </label>
              <Input
                    type="number"
                    step={['kilogramo', 'gramo'].includes(productoSeleccionado?.precio_por_unidad) ? "0.001" : "1"}
                    min={['kilogramo', 'gramo'].includes(productoSeleccionado?.precio_por_unidad) ? "0.001" : "1"}
                    max={
                        parseFloat(productoSeleccionado?.stock) === -1
                        ? undefined
                        : productoSeleccionado?.stock || 1
                    }
                    value={cantidadProducto}
                    onChange={(e) => {
                        setCantidadProducto(e.target.value); // 👈 STRING
                    }}
                    onBlur={() => {
                        const esUnidadPeso = ['kilogramo', 'gramo'].includes(productoSeleccionado?.precio_por_unidad);

                        let valor = esUnidadPeso
                        ? parseFloat(cantidadProducto)
                        : parseInt(cantidadProducto, 10);

                        if (isNaN(valor)) {
                        valor = esUnidadPeso ? 0.001 : 1;
                        }

                        setCantidadProducto(valor);
                    }}
                    onFocus={(e) => e.target.select()}
                    autoFocus
/>
              {parseFloat(productoSeleccionado?.stock) === -1 && (
                <p className="text-xs text-green-600 mt-1">∞ Stock ilimitado</p>
              )}
              {['kilogramo', 'gramo'].includes(productoSeleccionado?.precio_por_unidad) && (
                <p className="text-xs text-gray-500 mt-1">
                  Puedes ingresar fracciones (ej: 0.250 {productoSeleccionado?.precio_por_unidad === 'kilogramo' ? 'kg' : 'g'})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Observaciones (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ej: Sin cebolla, bien cocido, extra salsa..."
                value={observacionesProducto}
                onChange={(e) => setObservacionesProducto(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                Notas especiales para la cocina
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="text-xl font-bold text-orange-600">
                  ${(parseFloat(productoSeleccionado?.precio || 0) * cantidadProducto).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogProducto(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmarAgregarProducto}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar al Pedido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Agregar Comensales */}
      <Dialog open={dialogComensal} onOpenChange={setDialogComensal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Comensales</DialogTitle>
            <DialogDescription>
              ¿Cuántos comensales hay en esta mesa?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={agregarComensal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número de comensales</label>
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="Cantidad"
                value={numeroComensales}
                onChange={(e) => setNumeroComensales(parseInt(e.target.value) || 1)}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Se crearán con nombres automáticos: Comensal 1, Comensal 2, etc.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogComensal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Agregar {numeroComensales} {numeroComensales === 1 ? 'Comensal' : 'Comensales'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
