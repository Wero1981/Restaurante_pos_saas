import { useEffect, useState } from 'react';
import api from '../services/api';
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
import { ChevronRight, ChevronDown, Plus, Search, Edit, Trash2, FolderPlus } from "lucide-react";

export default function Productos() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [expandidos, setExpandidos] = useState({});
  
  // Dialogs
  const [dialogCategoria, setDialogCategoria] = useState(false);
  const [dialogProducto, setDialogProducto] = useState(false);
  
  // Forms
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', parent: null });
  const [productoForm, setProductoForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: 0,
    categoria: null,
    activo: true
  });
  const cargarProductos = async () => {
    try {
      const res = await api.get('/productos/');
      setProductos(res.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const res = await api.get('/productos/categorias/');
      setCategorias(res.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);



 

  const guardarCategoria = async (e) => {
    e.preventDefault();
    try {
      await api.post('/productos/categorias/', categoriaForm);
      setCategoriaForm({ nombre: '', parent: null });
      setDialogCategoria(false);
      cargarCategorias();
    } catch (error) {
      console.error('Error guardando categoría:', error);
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      await api.post('/productos/', {
        ...productoForm,
        categoria: categoriaSeleccionada || productoForm.categoria
      });
      setProductoForm({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: 0,
        categoria: null,
        activo: true
      });
      setDialogProducto(false);
      cargarProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
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
          <i className="fas fa-folder text-orange-500"></i>
          <span className="flex-1 font-medium text-sm">{cat.nombre}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCategoriaForm({ nombre: '', parent: cat.id });
              setDialogCategoria(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Agregar subcategoría"
          >
            <FolderPlus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {expandidos[cat.id] && cat.subcategorias && renderArbolCategorias(cat.subcategorias, level + 1)}
      </div>
    ));
  };

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaSeleccionada || p.categoria === categoriaSeleccionada;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-box-open text-orange-500 mr-3"></i>
          Productos y Categorías
        </h2>
        <p className="text-gray-600 mt-1">Gestiona tu inventario y categorías</p>
      </div>

      {/* Layout Principal */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Panel Izquierdo - Categorías */}
        <Card className="w-80 flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Categorías</h3>
              <Button
                size="sm"
                onClick={() => {
                  setCategoriaForm({ nombre: '', parent: null });
                  setDialogCategoria(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva
              </Button>
            </div>

            <div
              onClick={() => setCategoriaSeleccionada(null)}
              className={`flex items-center gap-2 p-2 mb-2 hover:bg-gray-100 rounded cursor-pointer ${
                !categoriaSeleccionada ? 'bg-orange-50 border-l-4 border-orange-500' : ''
              }`}
            >
              <i className="fas fa-list text-gray-600"></i>
              <span className="font-medium">Todas las categorías</span>
            </div>

            <div className="flex-1 overflow-y-auto border-t pt-2">
              {renderArbolCategorias(categorias.filter(c => !c.parent))}
            </div>
          </CardContent>
        </Card>

        {/* Panel Derecho - Productos */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            {/* Barra de búsqueda y acciones */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setDialogProducto(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            {/* Tabla de Productos */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-2 text-gray-300"></i>
                        <p>No hay productos para mostrar</p>
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map(producto => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {producto.descripcion || '-'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          ${parseFloat(producto.precio).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            producto.stock > 10 ? 'bg-green-100 text-green-800' :
                            producto.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {producto.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con contador */}
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              Mostrando {productosFiltrados.length} de {productos.length} productos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Crear Categoría */}
      <Dialog open={dialogCategoria} onOpenChange={setDialogCategoria}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoriaForm.parent ? 'Nueva Subcategoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar tus productos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarCategoria} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de la categoría *</label>
              <Input
                placeholder="Ej: Bebidas, Entradas, Platos Fuertes..."
                value={categoriaForm.nombre}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogCategoria(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Crear Categoría
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Crear Producto */}
      <Dialog open={dialogProducto} onOpenChange={setDialogProducto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
            <DialogDescription>
              Completa la información del producto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarProducto} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <Input
                  placeholder="Nombre del producto"
                  value={productoForm.nombre}
                  onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Precio *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productoForm.precio}
                  onChange={(e) => setProductoForm({ ...productoForm, precio: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="3"
                placeholder="Descripción del producto"
                value={productoForm.descripcion}
                onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stock inicial</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={productoForm.stock}
                  onChange={(e) => setProductoForm({ ...productoForm, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={productoForm.categoria || ''}
                  onChange={(e) => setProductoForm({ ...productoForm, categoria: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={productoForm.activo}
                onChange={(e) => setProductoForm({ ...productoForm, activo: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="activo" className="text-sm font-medium">Producto activo</label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogProducto(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Crear Producto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
