import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductoCard from '../productos/producto';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  DollarSign,
  Minus,
  Trash2,
  ShoppingCart
} from "lucide-react";

export default function PanelVentas({
  categorias,
  productos,
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
  return (
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
          
          {setModoRapido && (
            <button
              variant={modoRapido ? 'default' : 'outline'}
              onClick={() => setModoRapido(!modoRapido)}
              className={`mb-3 px-3 py-1 rounded-full text-sm font-medium ${
                modoRapido ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {modoRapido ? 'Modo Rápido' : 'Modo Normal'}
            </button>
          )}

          {/* Filtro por categoría */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {/* Boton todas */}
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              className={`
                min-w-[110px] h-16
                rounded-lg
                flex flex-col items-center justify-center
                border
                transition
                select-none
                cursor-pointer
                ${categoriaSeleccionada === null
                  ? 'bg-orange-500 text-white border-orange-500 scale-[1.02]'
                  : 'bg-white hover:bg-orange-50'}
                active:scale-95
              `}
            >
              <div className="text-3xl mb-1">📋</div>
              <span className="text-sm font-semibold">Todas</span>
            </button>
            {categorias
              .filter(cat => productos.some(p => p.categoria === cat.id && p.activo))
              .map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`
                    min-w-[110px] h-16
                    rounded-lg
                    flex flex-col items-center justify-center
                    border
                    transition
                    select-none
                    active:scale-95
                    ${categoriaSeleccionada === cat.id
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white hover:bg-orange-50'}
                  `}
                >
                  <span className="text-xl">
                    {cat.icono || "📦"}
                  </span>
                  <span className="text-xs font-semibold text-center px-1">
                    {cat.nombre}
                  </span>
                </button>
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
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{categoria.nombre}</span>               
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}

          {/* Productos sin categoría o cuando hay búsqueda */}
          {(busqueda || categoriaSeleccionada !== null) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {productosFiltrados.map(producto => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onAgregar={agregarProductoAlPedido}
                  modoRapido={modoRapido}
                />
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
