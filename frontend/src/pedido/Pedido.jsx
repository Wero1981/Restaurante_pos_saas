import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import CategoriaCard from '../productos/CategoriaCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronRight, 
  Plus, 
  Search, 
  Users, 
  Send, 
  ArrowLeft, 
  Receipt, 
  Trash2,
  UtensilsCrossed
     } from "lucide-react";
import ProductoCard from '../productos/producto';
import CancelarPedido from '../icons/CancelarPedido';


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
  const [detallesPedido, setDetallesPedido] = useState([]);
  const [modoRapido, setModoRapido] = useState(false);
  
  const categoriasPrincipales = useMemo(() => {
    const lista = Array.isArray(categorias) ? categorias : [];
    const principales = lista.filter(cat => !cat.parent);
    return principales.length ? principales : lista;
  }, [categorias]);

  const categoriasPorId = useMemo(() => {
    const mapa = {};
    const lista = Array.isArray(categorias) ? categorias : [];

    lista.forEach(cat => {
      if (cat?.id !== undefined) {
        mapa[cat.id] = cat;
      }
    });

    const agregarSubcategorias = (subcats) => {
      if (!Array.isArray(subcats)) return;
      subcats.forEach(subcat => {
        if (subcat?.id !== undefined) {
          mapa[subcat.id] = subcat;
        }
        if (subcat.subcategorias?.length) {
          agregarSubcategorias(subcat.subcategorias);
        }
      });
    };

    const principales = lista.filter(cat => !cat.parent);
    agregarSubcategorias(principales.length ? principales : lista);

    return mapa;
  }, [categorias]);

  const breadcrumbs = useMemo(() => {
    if (!categoriaSeleccionada) return [];

    const ruta = [];
    let actual = categoriasPorId[categoriaSeleccionada];
    const visitados = new Set();

    while (actual && !visitados.has(actual.id)) {
      ruta.unshift(actual);
      visitados.add(actual.id);
      if (!actual.parent) {
        break;
      }
      actual = categoriasPorId[actual.parent];
    }

    return ruta;
  }, [categoriaSeleccionada, categoriasPorId]);

  const categoriaActual = breadcrumbs.length
    ? breadcrumbs[breadcrumbs.length - 1]
    : categoriaSeleccionada
      ? categoriasPorId[categoriaSeleccionada] ?? null
      : null;

  const categoriaPrincipalActivaId = breadcrumbs.length ? breadcrumbs[0].id : null;

  const categoriaFiltroIds = useMemo(() => {
    if (!categoriaSeleccionada) return null;

    const ids = new Set();
    const visitados = new Set();

    const agregarDescendientes = (categoria) => {
      if (!categoria || visitados.has(categoria.id)) return;
      visitados.add(categoria.id);
      ids.add(categoria.id);

      if (Array.isArray(categoria.subcategorias)) {
        categoria.subcategorias.forEach(subcat => agregarDescendientes(categoriasPorId[subcat.id] || subcat));
      }
    };

    const seleccionada = categoriasPorId[categoriaSeleccionada];
    agregarDescendientes(seleccionada);

    return ids.size ? Array.from(ids) : null;
  }, [categoriaSeleccionada, categoriasPorId]);

  const tieneSubcategorias = Boolean(
    categoriaActual &&
    Array.isArray(categoriaActual.subcategorias) &&
    categoriaActual.subcategorias.length > 0
  );

  const tieneProductos = Boolean(
    categoriaActual &&
    Array.isArray(productos) &&
    productos.some(p => p.categoria === categoriaActual.id)
  );


  /*---------------------- HANDLES----------------------- */
  const handleCancelarPedido = async () => {
    try {
      const result = await api.post(`/pedidos/cancelar/`, {
        pedido_id: pedidoActivo.id
      });
      if (result.status === 200) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          text: 'Pedido cancelado correctamente',
          showConfirmButton: false,
          timer: 2000,
        });
        resetearPOS();
        navigate('/mesas');
      }
      else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          text: 'No se pudo cancelar el pedido',
          icon: 'error',
          showConfirmButton: false,
          timer: 2000,
        });
      }

    } catch (error) {
      console.error('Error cancelando pedido:', error);
      }
  }





    const handleResetCategorias = () => {
    setCategoriaSeleccionada(null);
    setBusqueda('');
  };

  const handleSeleccionCategoria = (categoriaId) => {
    if (categoriaId === undefined || categoriaId === null) {
      handleResetCategorias();
      return;
    }
    setCategoriaSeleccionada(categoriaId);
    setBusqueda('');
  };

  const handleIrACategoriaPadre = () => {
    if (!categoriaActual) return;
    handleSeleccionCategoria(categoriaActual.parent ?? null);
  };

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

  const agregarComensal = async () => {
    const numeroComensales = 1; // Siempre agregar 1 comensal
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

    if (detalle.cancelado) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'El producto ya está cancelado',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
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

  const productosFiltrados = (Array.isArray(productos) ? productos : []).filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaFiltroIds || categoriaFiltroIds.includes(p.categoria);
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

  const quitarComensalPedido = async (comensalId) => {
    if (comensalId === 'sin-asignar') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Asigna un comensal antes de quitarlo',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const grupo = detallesPorComensal[comensalId];
    const nombre = grupo?.comensal?.nombre || 'este comensal';
    const productosAsociados = grupo?.items?.length || 0;
    const productosEnCocina = grupo?.items?.some(item => item.enviado_cocina) || false;

    const numericId = Number(comensalId);
    if (Number.isNaN(numericId)) {
      console.error('ID de comensal inválido:', comensalId);
      return;
    }

    try {
      await api.delete(`/comensales/${numericId}/`);

      setComensales((prev) => prev.filter((comensal) => comensal.id !== numericId));

      if (comensalSeleccionado?.id === numericId) {
        seleccionarComensal(null);
      }

      await cargarDetallesPedido();
      await cargarComensales();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: productosAsociados
          ? `${nombre} eliminado${productosEnCocina ? ' (había productos en cocina)' : ''}`
          : `${nombre} eliminado`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error eliminando comensal:', error);
      const mensaje = error.response?.data?.error || 'No se pudo eliminar el comensal';
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: mensaje,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  };

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
    return detallesPedido.reduce((sum, detalle) => {
      if (detalle.cancelado) {
        return sum;
      }
      return sum + parseFloat(detalle.subtotal || 0);
    }, 0);
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
    <>
      <div className="h-[calc(100vh-100px)] flex flex-col gap-4 bg-gray-100">
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
          {/* Panel Izquierdo - Categorías */}
          <div className="w-64 flex flex-col overflow-y-auto">
            <Card className="flex-1">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3">Categorías</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleResetCategorias}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoriaSeleccionada === null
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Todas las categorías
                  </button>
                  {(categoriasPrincipales.length ? categoriasPrincipales : []).map(categoria => (
                    <CategoriaCard
                      key={categoria.id}
                      categoria={categoria}
                      activa={categoriaPrincipalActivaId === categoria.id}
                      onClick={() => handleSeleccionCategoria(categoria.id)}
                    />
                  ))}
                  {!categoriasPrincipales.length && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No hay categorías registradas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Central - Productos */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              {breadcrumbs.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetCategorias}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Todas
                    </button>
                    {breadcrumbs.map((categoria, index) => (
                      <div key={categoria.id} className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        {index === breadcrumbs.length - 1 ? (
                          <span className="font-semibold text-gray-800">{categoria.nombre}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSeleccionCategoria(categoria.id)}
                            className="hover:text-orange-600"
                          >
                            {categoria.nombre}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {categoriaActual?.parent !== null && categoriaActual?.parent !== undefined && (
                    <Button variant="outline" onClick={handleIrACategoriaPadre}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Atrás
                    </Button>
                  )}
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <div className="relative flex-1 ">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* modo rapido */}
                <Button
                  type="button"
                  variant={modoRapido ? 'default' : 'outline'}
                  onClick={() => setModoRapido(!modoRapido)}
                  className={modoRapido ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white hover:bg-gray-100 text-orange-500'}
                >
                  {modoRapido ? 'Modo Rápido' : 'Modo Normal'}
                </Button>

                {/* Cancelar pedido */}
                {pedidoActivo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelarPedido}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <CancelarPedido className="w-5 h-5 mr-2"/>
                    Pedido
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                <div className="space-y-4 pb-4">
                  {tieneSubcategorias && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Subcategorías
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {categoriaActual?.subcategorias?.map(subcategoria => (
                          <CategoriaCard
                            key={subcategoria.id}
                            categoria={subcategoria}
                            activa={categoriaSeleccionada === subcategoria.id}
                            onClick={() => handleSeleccionCategoria(subcategoria.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {tieneProductos && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Productos
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {productosFiltrados
                          .filter(p => p.categoria === categoriaActual.id)
                          .map(producto => (
                            <ProductoCard
                                key={producto.id}
                              producto={producto}
                              onAgregar={agregarProductoAlPedido}
                              modoRapido={modoRapido}
                            
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {productosFiltrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <Search className="w-12 h-12 mb-2" />
                      <p className="text-sm text-center">No se encontraron productos</p>
                    </div>
                  )}
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
                      <div className="flex items-center flex-1 gap-2 mb-2 pb-2 border-b">
                        <div className='flex items-center gap-2'>
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold text-sm">
                            {grupo.comensal?.nombre || 'Sin asignar'}
                          </span>
                        </div>

                        {comensalId !== 'sin-asignar' && (
                          <button
                            onClick={() => quitarComensalPedido(comensalId)}
                            className="ml-auto text-red-600 hover:text-red-800 flex items-center text-xs"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {grupo.items.map(detalle => {
                          const colorFondo = obtenerColorProducto(grupo.items, detalle.id, detalle.producto.id);
                          const esCancelado = detalle.cancelado;
                          const detalleClasses = [
                            'flex justify-between items-start text-xs p-2 rounded',
                            colorFondo,
                            esCancelado ? 'opacity-60 bg-red-100' : ''
                          ].join(' ').trim();
                          return (
                            <div 
                              key={detalle.id} 
                              className={detalleClasses}
                            >
                              <div className="flex-1">
                                <p className={`font-medium ${esCancelado ? 'line-through text-gray-500' : ''}`}>
                                  {detalle.producto.nombre}
                                </p>
                                <p className={`text-gray-600 ${esCancelado ? 'line-through' : ''}`}>
                                  {detalle.cantidad}x ${parseFloat(detalle.precio_unitario).toFixed(2)}
                                </p>
                              
                                {detalle.observaciones && (
                                  <p className="text-orange-600 text-xs italic mt-1">
                                    📝 {detalle.observaciones}
                                  </p>
                                )}
                                {detalle.enviado_cocina === true && !esCancelado && (
                                  <span className="text-green-600 text-xs">✓ En cocina</span>
                                )}
                                {esCancelado && (
                                  <span className="text-red-600 text-xs font-semibold">✕ Cancelado</span>
                                )}
                              </div>
                              <span className={`font-semibold ${esCancelado ? 'line-through text-gray-500' : ''}`}>
                                ${parseFloat(detalle.subtotal).toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeProductoDelPedido(detalle)}
                                disabled={detalle.enviado_cocina || esCancelado}
                                className={`ml-2 ${
                                  detalle.enviado_cocina || esCancelado
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-600 hover:text-red-800'
                                }`}
                                title={
                                  detalle.enviado_cocina
                                    ? 'No se puede eliminar (ya en cocina)'
                                    : esCancelado
                                      ? 'Producto cancelado'
                                      : 'Eliminar producto del pedido'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between text-sm font-semibold">
                        <span>Subtotal:</span>
                        <span>
                          ${grupo.items
                            .filter((d) => !d.cancelado)
                            .reduce((sum, d) => sum + parseFloat(d.subtotal), 0)
                            .toFixed(2)}
                        </span>
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

      </div>
      {/* Selector de comensales */}
      <div className="flex flex-row">
        <div className="flex overflow-x-auto space-x-2 pt-2 bg-white border-t">    
          <button
            onClick={() => agregarComensal()}
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
             <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-primary shadow">
              <UtensilsCrossed size={20} />
             </span>
          </button>
          {comensales.map((comensal, index) => (
            <button
              key={comensal.id}
              onClick={() => seleccionarComensal(comensal)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-colors ${
                comensalSeleccionado?.id === comensal.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Users className="w-3 h-3 inline mr-2" />
              ({index + 1})
            
            </button>
          ))}
          {comensales.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              Agrega Comensales para comenzar a pedir
            </p>
          )}
        </div>
      </div>
    </>
  );
}
