// btn para mostrar productos de una categoría
import React from 'react';

export default function CategoriaCard({ categoria, onClick, activa }) {
  return (
    <button
      onClick={onClick}
      className={`
        h-28
        flex flex-col
        items-center
        justify-center
        cursor-pointer
        select-none
        transition-all
        border
        rounded-lg
        w-full
        ${activa
          ? 'bg-orange-500 text-white border-orange-500 scale-[1.02]'
          : 'bg-white hover:bg-orange-50'}
        active:scale-95
      `}
    >
      <div className="text-3xl mb-1">
        {categoria.icono || "📦"}
      </div>

      <span className="text-sm font-semibold text-center px-2">
        {categoria.nombre}
      </span>
    </button>
  );
}

