import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { usePOS } from '../context/POSContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, PackagePlus, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";

export default function MovimientosEntrada() {
  const { restauranteActivo } = usePOS();
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargandoProductos(true);
        const res = await api.get('/productos/');
        const listado = Array.isArray(res.data) ? res.data : [];
        setProductos(listado);
        setSeleccionado(null);
        setBusqueda('');
        setCantidad('');
        setMotivo('');
      } catch (error) {
        console.error('Error cargando productos para movimientos de entrada:', error);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cargar el inventario',
          text: 'Intenta nuevamente o recarga la página.'
        });
      } finally {
        setCargandoProductos(false);
      }
    };

    cargar();
  }, [restauranteActivo?.id]);

  const productosFiltrados = useMemo(() => {
    if (!busqueda) {
      return productos;
    }
    const termino = busqueda.toLowerCase();
    return productos.filter((producto) => {
      const nombre = (producto.nombre || '').toLowerCase();
      const descripcion = (producto.descripcion || '').toLowerCase();
      const codigo = (producto.codigo_barras || '').toLowerCase();
      return nombre.includes(termino) || descripcion.includes(termino) || codigo.includes(termino);
    });
  }, [productos, busqueda]);

  const seleccionarProducto = (producto) => {
    setSeleccionado(producto);
    setCantidad('');
    setMotivo('');
  };

  const formatearStock = (stock) => {
    if (stock === -1) {
      return 'Ilimitado';
    }
    const valor = Number(stock || 0);
    return valor % 1 === 0 ? valor.toString() : valor.toFixed(3);
  };

  const registrarMovimiento = async (evento) => {
    evento.preventDefault();
    if (!seleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un producto',
        text: 'Busca y elige un producto antes de registrar la entrada.'
      });
      return;
    }

    if (seleccionado.stock === -1) {
      Swal.fire({
        icon: 'info',
        title: 'Stock ilimitado',
        text: 'Los productos con stock ilimitado no requieren ajustes manuales.'
      });
      return;
    }

    const cantidadNumero = Number(cantidad);
    if (!cantidad || Number.isNaN(cantidadNumero) || cantidadNumero <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'Ingresa una cantidad mayor a cero.'
      });
      return;
    }

    const stockActual = Number(seleccionado.stock || 0);
    let nuevoStock = stockActual;

    if (tipoMovimiento === 'entrada') {
      nuevoStock = stockActual + cantidadNumero;
    } else {
      if (cantidadNumero > stockActual) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock insuficiente',
          text: `Solo hay ${formatearStock(stockActual)} en inventario.`
        });
        return;
      }
      nuevoStock = stockActual - cantidadNumero;
    }

    try {
      setRegistrando(true);
      await api.patch(`/productos/${seleccionado.id}/`, {
        stock: nuevoStock
      });

      const productoActualizado = { ...seleccionado, stock: nuevoStock };
      setSeleccionado(productoActualizado);
      setProductos((prev) => prev.map((producto) => (
        producto.id === seleccionado.id ? productoActualizado : producto
      )));

      const mensajeExito = tipoMovimiento === 'entrada'
        ? `El stock de ${seleccionado.nombre} aumentó a ${formatearStock(nuevoStock)}.`
        : `El stock de ${seleccionado.nombre} disminuyó a ${formatearStock(nuevoStock)}.`;

      Swal.fire({
        icon: 'success',
        title: 'Stock actualizado',
        text: mensajeExito
      });
      setCantidad('');
      setMotivo('');
    } catch (error) {
      console.error('Error registrando entrada de stock:', error);
      const detalle = error.response?.data?.detail;
      Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar la entrada',
        text: detalle || 'Revisa los datos e intenta nuevamente.'
      });
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <PackagePlus className="w-8 h-8 text-orange-500" />
          Movimientos de Inventario
        </h1>
        <p className="text-gray-600 mt-1">Registra ingresos o salidas y mantén actualizado tu inventario.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[420px,1fr] flex-1">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Buscar producto</CardTitle>
            <CardDescription>Selecciona el producto al que deseas registrar la entrada.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Nombre, descripción o código de barras"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="pl-9"
                aria-label="Buscar producto"
              />
            </div>

            <div className="flex-1 overflow-auto border rounded-lg divide-y">
              {cargandoProductos ? (
                <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando inventario...
                </div>
              ) : productosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No se encontraron productos.
                </div>
              ) : (
                productosFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => seleccionarProducto(producto)}
                    className={`w-full text-left p-4 hover:bg-orange-50 transition-colors ${
                      seleccionado?.id === producto.id ? 'bg-orange-100/70 border-l-4 border-orange-500' : ''
                    }`}
                    aria-label={`Seleccionar ${producto.nombre}`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{producto.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Stock actual</p>
                        <p className="text-lg font-semibold text-gray-800">{formatearStock(producto.stock)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Registrar movimiento</CardTitle>
            <CardDescription>Incrementa o reduce el stock del producto seleccionado.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {seleccionado ? (
              <form className="space-y-5" onSubmit={registrarMovimiento}>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-gray-600">Producto seleccionado</p>
                  <p className="text-xl font-semibold text-gray-800">{seleccionado.nombre}</p>
                  <p className="text-sm text-gray-500 mt-1">Stock actual: {formatearStock(seleccionado.stock)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de movimiento">
                  <Button
                    type="button"
                    variant={tipoMovimiento === 'entrada' ? 'default' : 'outline'}
                    className={`flex items-center justify-center gap-2 ${tipoMovimiento === 'entrada' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => setTipoMovimiento('entrada')}
                    aria-pressed={tipoMovimiento === 'entrada'}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Entrada
                  </Button>
                  <Button
                    type="button"
                    variant={tipoMovimiento === 'salida' ? 'default' : 'outline'}
                    className={`flex items-center justify-center gap-2 ${tipoMovimiento === 'salida' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    onClick={() => setTipoMovimiento('salida')}
                    aria-pressed={tipoMovimiento === 'salida'}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Salida
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cantidad">
                    Cantidad
                  </label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.001"
                    min="0"
                    value={cantidad}
                    onChange={(evento) => setCantidad(evento.target.value)}
                    placeholder="Ej: 10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Usa decimales si tu producto se maneja por peso o volumen.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="motivo">
                    Nota interna (opcional)
                  </label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(evento) => setMotivo(evento.target.value)}
                    placeholder="Ej: Ajuste por compra a proveedor"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={registrando}>
                  {registrando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      {tipoMovimiento === 'entrada' ? (
                        <ArrowUpCircle className="w-4 h-4" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4" />
                      )}
                      {tipoMovimiento === 'entrada' ? 'Registrar entrada' : 'Registrar salida'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">El movimiento actualiza inmediatamente el stock del producto.</p>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-3">
                <ArrowUpCircle className="w-12 h-12 text-orange-400" />
                <p className="text-lg font-semibold">Selecciona un producto para comenzar</p>
                <p className="text-sm">Busca el producto en la lista y haz clic para registrar una entrada.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
