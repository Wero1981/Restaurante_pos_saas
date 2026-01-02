import { createContext, useContext, useState, useCallback } from 'react';

const POSContext = createContext();

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS debe usarse dentro de un POSProvider');
  }
  return context;
};

export const POSProvider = ({ children }) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [carrito, setCarrito] = useState([]);

  // Calcular el total del carrito
  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  // Agregar producto al carrito
  const agregarAlCarrito = useCallback((producto) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.id === producto.id);
      
      if (existente) {
        // Si ya existe, incrementar cantidad
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Si no existe, agregarlo
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  }, []);

  // Remover producto del carrito
  const removerDelCarrito = useCallback((productoId) => {
    setCarrito(prev => prev.filter(item => item.id !== productoId));
  }, []);

  // Actualizar cantidad de un producto
  const actualizarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad <= 0) {
      removerDelCarrito(productoId);
      return;
    }
    
    setCarrito(prev =>
      prev.map(item =>
        item.id === productoId
          ? { ...item, cantidad }
          : item
      )
    );
  }, [removerDelCarrito]);

  // Incrementar cantidad
  const incrementarCantidad = useCallback((productoId) => {
    setCarrito(prev =>
      prev.map(item =>
        item.id === productoId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  }, []);

  // Decrementar cantidad
  const decrementarCantidad = useCallback((productoId) => {
    setCarrito(prev =>
      prev.map(item =>
        item.id === productoId
          ? { ...item, cantidad: Math.max(1, item.cantidad - 1) }
          : item
      )
    );
  }, []);

  // Limpiar carrito
  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
  }, []);

  // Seleccionar mesa
  const seleccionarMesa = useCallback((mesa) => {
    setMesaSeleccionada(mesa);
  }, []);

  // Limpiar mesa seleccionada
  const limpiarMesa = useCallback(() => {
    setMesaSeleccionada(null);
  }, []);

  // Resetear todo
  const resetearPOS = useCallback(() => {
    setMesaSeleccionada(null);
    setCarrito([]);
  }, []);

  const value = {
    // Estado
    mesaSeleccionada,
    carrito,
    total,
    
    // Acciones del carrito
    agregarAlCarrito,
    removerDelCarrito,
    actualizarCantidad,
    incrementarCantidad,
    decrementarCantidad,
    limpiarCarrito,
    
    // Acciones de mesa
    seleccionarMesa,
    limpiarMesa,
    
    // Reset general
    resetearPOS,
  };

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
};
