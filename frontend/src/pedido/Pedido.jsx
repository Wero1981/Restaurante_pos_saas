import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
import { ChevronRight, ChevronDown, Plus, Search, Users, Send, ArrowLeft, Receipt, Folder, List, Trash2 } from "lucide-react";
import ProductoCard from '../productos/producto';

export default function Pedido() {
  const navigate = useNavigate();
  const { 
    mesaSeleccionada, 
    pedidoActivo, 
    comensalSeleccionado, 
    seleccionarComensal,
    resetearPOS,
    userRol
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

  const agregarProductoAlPedido = (producto, cantidad = 1) => {
    if (!comensalSeleccionado) {
      alert('Por favor selecciona un comensal primero');
      return;
    }
    
    // Agregar directamente con la cantidad seleccionada
    agregarDirectamente(producto, cantidad);
  };

  // Eliminar Producto del Pedido
  const removeProductoDelPedido = async (detalle) => {

    // No permitir eliminar si ya fue enviado a cocina
    if (detalle.enviado_cocina) {
      alert('No se puede eliminar un producto que ya fue enviado a cocina');
      return;
    }

    try {
      const res = await api.delete(`/pedidos/detalle/${detalle.id}/`);
      if (res.status === 204) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Producto eliminado del pedido',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        cargarDetallesPedido();
      }
    } catch (error) {
      console.error('Error eliminando producto del pedido:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar producto del pedido';
      alert(errorMsg);
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
      if (pendientes.length === 0) {
        alert('No hay productos pendientes para enviar a cocina');
        return;
      }

      await api.post('/pedidos/enviar-cocina/', {
        pedido_id: pedidoActivo.id
      });
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Productos enviados a cocina',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
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

  // Agrupar detalles por comensal y luego por producto
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

  // Función para obtener color de fondo para productos duplicados
  const obtenerColorProducto = (items, detalleId, productoId) => {
    // Encontrar todos los detalles del mismo producto
    const mismoProducto = items.filter(d => d.producto.id === productoId);
    if (mismoProducto.length <= 1) return ''; // No hay duplicados
    
    // Asignar colores diferentes para cada grupo de productos
    const colores = [
      'bg-blue-50',
      'bg-green-50', 
      'bg-yellow-50',
      'bg-purple-50',
      'bg-pink-50',
      'bg-indigo-50'
    ];
    
    // Usar el producto ID como índice para el color
    const colorIndex = productoId % colores.length;
    return colores[colorIndex];
  };

  const calcularTotalPedido = () => {
    return detallesPedido.reduce((sum, detalle) => sum + parseFloat(detalle.subtotal || 0), 0);
  };

  const volverAMesas = () => {
    const confirmar = window.confirm('¿Volver a mesas? Los cambios no enviados a cocina se perderán');
    
    if (confirmar) {
      resetearPOS();
      navigate('/mesas');
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaSeleccionada, pedidoActivo, navigate]);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
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
          <div className="flex items-center gap-2">
            {/* Regresar a caja con mesa seleccionada solo se muestra a cajeros y administradores */}
            {(userRol === 'cajero' || userRol === 'admin') && (
              <Button
                onClick={() => navigate('/caja')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Regresar a Caja
              </Button>
            )}
            <Button onClick={enviarACocina} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Enviar a Cocina
            </Button>
          </div>
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
                {productosFiltrados.map(producto => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    onAgregar={agregarProductoAlPedido}
                    disabled={!comensalSeleccionado}
                  />
                ))}
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
                    <div className="space-y-1">
                      {grupo.items.map(detalle => {
                        const colorFondo = obtenerColorProducto(grupo.items, detalle.id, detalle.producto.id);
                        return (
                          <div 
                            key={detalle.id} 
                            className={`flex justify-between items-start text-xs p-2 rounded ${colorFondo}`}
                          >
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
                            <button
                              onClick={() => removeProductoDelPedido(detalle)}
                              disabled={detalle.enviado_cocina}
                              className={`ml-2 ${
                                detalle.enviado_cocina 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                              title={detalle.enviado_cocina ? 'No se puede eliminar (ya en cocina)' : 'Eliminar producto del pedido'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
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
                        productoSeleccionado?.stock && Number(productoSeleccionado.stock) === -1
                        ? undefined
                        : (productoSeleccionado?.stock ? Number(productoSeleccionado.stock) : 1)
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
              {productoSeleccionado?.stock && Number(productoSeleccionado.stock) === -1 && (
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
