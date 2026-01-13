import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductoCard({ 
  producto, 
  onAgregar, 
  disabled = false,
  modoRapido = false
}) {
  const [cantidad, setCantidad] = useState(1);
  const [modoManual, setModoManual] = useState(false);
  
  // Opciones para select según tipo de unidad
  const opcionesUnidad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
  const opcionesKilogramo = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
  const opcionesGramo = [100, 250, 500, 750, 1000];
  const opcionesLitro = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

  // Seleccionar opciones según tipo
  let opciones = opcionesUnidad;
  let unidadMedida = '';
  
  if (producto.precio_por_unidad === 'kilogramo') {
    opciones = opcionesKilogramo;
    unidadMedida = 'kg';
  } else if (producto.precio_por_unidad === 'gramo') {
    opciones = opcionesGramo;
    unidadMedida = 'g';
  } else if (producto.precio_por_unidad === 'litro') {
    opciones = opcionesLitro;
    unidadMedida = 'L';
  } else if (producto.precio_por_unidad === 'mililitro') {
    opciones = [100, 250, 500, 750, 1000];
    unidadMedida = 'ml';
  }

  // Verificar stock
  const stockNumerico = Number(producto.stock);
  const esStockIlimitado = stockNumerico === -1;
  const tieneStock = esStockIlimitado || stockNumerico > 0;
  const sinStock = !tieneStock;

  const handleAgregar = () => {
    if (onAgregar && !disabled && !sinStock) {
      onAgregar(producto, cantidad);
    }
  };

  const handleClickCard = () => {
    if (modoRapido) {
      onAgregar(producto, 1);
    }
  };

  return (
  
     <div className={`w-full h-[260px] flex flex-col relative rounded-lg border-2 overflow-hidden transition-all min-w-0 ${

        disabled || sinStock
          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-orange-500 hover:shadow-lg'
      }`}
      onClick={handleClickCard} 
    >
      {/* Imagen o Placeholder */}
      <div className="relative h-28 flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-50">
        {producto.url_imagen ? (
          <img 
            src={producto.url_imagen} 
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`${producto.url_imagen ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
        >
          <div className="text-center p-4">
            <h3 className="font-bold text-lg text-orange-600 leading-tight">
              {producto.nombre}
            </h3>
          </div>
        </div>
        
        {/* Badge de stock */}
        {sinStock && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Sin stock
          </div>
        )}
        {esStockIlimitado && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
            ∞
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col p-3 space-y-2">
        {/* Nombre (si hay imagen) */}
        {producto.url_imagen && (
          <h4 className="font-semibold text-xs line-clamp-2">
            {producto.nombre}
          </h4>
        )}

        {/* Descripción */}
        {producto.descripcion && (
          <p className="text-xs text-gray-600 line-clamp-1">
            {producto.descripcion}
          </p>
        )}

        {/* Spacer para empujar el precio y botones hacia abajo */}
        <div className="flex-1"></div>

        {/* Precio */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-orange-600">
            ${parseFloat(producto.precio).toFixed(2)}
          </span>
          {unidadMedida && (
            <span className="text-xs text-gray-500">
              por {unidadMedida}
            </span>
          )}
        </div>

        {/* Selector de cantidad y botón agregar */}
        {!modoRapido && (
        <div className="flex gap-2">
          {modoManual ? (
            <div className="flex-1 relative">
              <input
                type="number"
                value={cantidad}
                onChange={(e) => {
                  const val = e.target.value;
                  setCantidad(val === '' ? '' : parseFloat(val) || 0);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!val || val <= 0) setCantidad(1);
                }}
                disabled={disabled || sinStock}
                step="0.01"
                min="0.01"
                className="w-full min-w-0 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"

                placeholder={`Cantidad en ${unidadMedida}`}
              />
              <button
                onClick={() => {
                  setModoManual(false);
                  setCantidad(1);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                title="Volver a opciones"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex-1 relative">
              <select
                value={cantidad}
                onChange={(e) => setCantidad(parseFloat(e.target.value))}
                disabled={disabled || sinStock}
                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                {opciones.map(opt => (
                  <option key={opt} value={opt}>
                    {opt} {unidadMedida}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setModoManual(true)}
                disabled={disabled || sinStock}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600 text-xs font-semibold px-1"
                title="Ingresar manualmente"
              >
                ✎
              </button>
            </div>
          )}
          
          <Button
            onClick={handleAgregar}
            disabled={disabled || sinStock}
            size="sm"
            className="px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}