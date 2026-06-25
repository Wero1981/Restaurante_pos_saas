import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  DollarSign,
  Minus,
  Trash2,
  ShoppingCart
} from "lucide-react";
import CategoriaCard from '../productos/CategoriaCard';
import ProductoCard from '../productos/producto';
import { useMemo } from "react";

export default function PanelVentas({
  categorias,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  busqueda,
  setBusqueda,
  carrito,
  incrementarCantidad,
  decrementarCantidad,
  removerDelCarrito,
  calcularTotal,
  onProcesarPago,
  modoRapido,
  setModoRapido,
  agregarProductoAlPedido,
  productosFiltrados,
  botonPagoTexto = "Procesar Pago"
}) {
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
      if (cat?.subcategorias?.length) {
        cat.subcategorias.forEach(subcat => {
          if (subcat?.id !== undefined) {
            mapa[subcat.id] = subcat;
          }
        });
      }
    });

    return mapa;
  }, [categorias]);

  const categoriaActual = categoriaSeleccionada ? categoriasPorId[categoriaSeleccionada] ?? null : null;

  const subcategoriasVisibles = categoriaActual?.subcategorias ?? [];

  return (
    <div className="flex gap-4 flex-1 overflow-hidden">
      {/* Panel Izquierdo - Categorías */}
      <div className="w-64 flex flex-col overflow-y-auto">
        <Card className="flex-1">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-3">Categorías</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  categoriaSeleccionada === null
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Todas las categorías
              </button>
              {categoriasPrincipales.map(categoria => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  activa={categoriaSeleccionada === categoria.id}
                  onClick={() => setCategoriaSeleccionada(categoria.id)}
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            {setModoRapido && (
              <Button
                type="button"
                variant={modoRapido ? 'default' : 'outline'}
                onClick={() => setModoRapido(!modoRapido)}
                className={modoRapido ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                {modoRapido ? 'Modo Rápido' : 'Modo Normal'}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto space-y-6">
            {subcategoriasVisibles.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Subcategorías</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {subcategoriasVisibles.map(subcategoria => (
                    <CategoriaCard
                      key={subcategoria.id}
                      categoria={subcategoria}
                      activa={categoriaSeleccionada === subcategoria.id}
                      onClick={() => setCategoriaSeleccionada(subcategoria.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Productos</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {productosFiltrados.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-10">
                    <Search className="w-10 h-10 mb-3" />
                    <p className="text-sm text-center">
                      No hay productos disponibles para esta selección
                    </p>
                  </div>
                ) : (
                  productosFiltrados.map(producto => (
                    <ProductoCard
                      key={producto.id}
                      producto={producto}
                      onAgregar={agregarProductoAlPedido}
                      modoRapido={modoRapido}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            onClick={onProcesarPago}
            disabled={carrito.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            {botonPagoTexto}
          </Button>
        </div>
      </div>
    </div>
  );
}
