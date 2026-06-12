import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const POSContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS debe usarse dentro de un POSProvider');
  }
  return context;
};

export const POSProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRol, setUserRol] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [comensalSeleccionado, setComensalSeleccionado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [restauranteActivo, setRestauranteActivo] = useState(null);


  const cargarUsuarioYPermisos = async () => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('🔄 Cargando datos del usuario desde localStorage...', userStr);
      
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Obtener rol y permisos directamente del localStorage (ya vienen del login)
        if (userData.rol) {
          setUserRol(userData.rol);
        }
        
        if (userData.permisos && Array.isArray(userData.permisos)) {
          const codigosPermisos = userData.permisos.map(p => p.codigo);
          setPermisos(codigosPermisos);
        } else {
          setPermisos([]);
        }

        console.log('✅ Usuario cargado:', userData);
        console.log('✅ Rol del usuario:', userData.rol);
        console.log('✅ Permisos del usuario:', userData.permisos);

        //usuario normal con restaurante asignado
        if(userData.rol !== 'admin' && userData.restaurante_id) {
          const restaurante = {
            id: userData.restaurante_id,
            nombre: userData.restaurante_nombre || 'Restaurante',
            slug: userData.restaurante_slug || null,
          };
          setRestauranteActivo(restaurante);
          localStorage.setItem('restaurante_id', String(userData.restaurante_id));
          localStorage.setItem('restauranteActivo', JSON.stringify(restaurante));
        }

        //Admin sin restaurante asignado, pero con restaurante_id en localStorage (para pruebas)
        if(userData.rol === 'admin') {
          const restauranteGuardado = localStorage.getItem('restauranteActivo');
          if (restauranteGuardado) {
            const restaurante = JSON.parse(restauranteGuardado);
            setRestauranteActivo(restaurante);
            if (restaurante?.id) {
              localStorage.setItem('restaurante_id', String(restaurante.id));
            }
          } else if (userData.restaurante_id) {
            const restaurante = {
              id: userData.restaurante_id,
              nombre: userData.restaurante_nombre || 'Restaurante',
              slug: userData.restaurante_slug || null,
            };
            setRestauranteActivo(restaurante);
            localStorage.setItem('restaurante_id', String(restaurante.id));
            localStorage.setItem('restauranteActivo', JSON.stringify(restaurante));
          }
        }


      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      setPermisos([]);
    }
  };

  // Cargar usuario y permisos al montar el componente
  useEffect(() => {
    // Solo cargar si hay token (sesión activa)
    const token = localStorage.getItem('token');
    if (token) {
      Promise.resolve().then(() => cargarUsuarioYPermisos());
    }
  }, []);

  // Cargar permisos del usuario autenticado desde localStorage 
  

  // Verificar si el usuario tiene un permiso específico
  const tienePermiso = useCallback((codigoPermiso) => {
    // Si es admin, tiene acceso a todo
    if (userRol === 'admin') {
      return true;
    }
    // Si tiene 'todos_los_permisos', puede hacer todo
    if (permisos.includes('todos_los_permisos')) {
      return true;
    }
    // Verificar permiso específico
    return permisos.includes(codigoPermiso);
  }, [permisos, userRol]);

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

  // Establecer pedido activo
  const establecerPedidoActivo = useCallback((pedido) => {
    setPedidoActivo(pedido);
  }, []);

  // Seleccionar comensal
  const seleccionarComensal = useCallback((comensal) => {
    setComensalSeleccionado(comensal);
  }, []);

  // Limpiar comensal
  const limpiarComensal = useCallback(() => {
    setComensalSeleccionado(null);
  }, []);

  // Resetear todo
  const resetearPOS = useCallback(() => {
    setMesaSeleccionada(null);
    setPedidoActivo(null);
    setComensalSeleccionado(null);
    setCarrito([]);
  }, []);

  const  seleccionarRestaurante = useCallback((restaurante) => {
    setRestauranteActivo(restaurante);
    localStorage.setItem('restauranteActivo', JSON.stringify(restaurante));
    localStorage.setItem('restaurante_id', String(restaurante.id));
    resetearPOS();
  }, [resetearPOS]);
  // Cerrar sesión y limpiar todo
  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('restaurante_id');
    localStorage.removeItem('restauranteActivo');
    setUser(null);
    setUserRol(null);
    setPermisos([]);
    resetearPOS();
    setShowSidebar(true);
  }, [resetearPOS]);

  const value = {
    // Usuario y permisos
    user,
    userRol,
    permisos,
    tienePermiso,
    cargarUsuarioYPermisos,
    cerrarSesion,
    
    // Estado
    mesaSeleccionada,
    pedidoActivo,
    comensalSeleccionado,
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
    
    // Acciones de pedido
    establecerPedidoActivo,
    
    // Acciones de comensal
    seleccionarComensal,
    limpiarComensal,
    
    // Reset general
    resetearPOS,

    // Layout
    showSidebar,
    setShowSidebar,
    // Restaurante
    restauranteActivo,
    seleccionarRestaurante,
  };

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
};
