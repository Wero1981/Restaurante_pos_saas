import { Navigate } from 'react-router-dom';
import { usePOS } from '../context/POSContext';

/**
 * Componente para proteger rutas basadas en permisos
 * 
 * Uso:
 * <RutaProtegida permiso="administrar_usuarios">
 *   <GestionUsuarios />
 * </RutaProtegida>
 * 
 * O con múltiples permisos:
 * <RutaProtegida permisos={['crear_pedidos', 'editar_pedidos']}>
 *   <Pedidos />
 * </RutaProtegida>
 */
export function RutaProtegida({ 
  rol,
  permiso,           // Permiso único requerido
  permisos = [],     // Array de permisos (requiere al menos uno)
  requiereTodos = false,  // Si true, requiere TODOS los permisos del array
  children,          // Componente a renderizar si tiene permiso
  redirectTo = '/sin-permiso'  // Ruta a la que redirigir si no tiene permiso
}) {
  const { tienePermiso, userRol } = usePOS();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rol && userRol !== rol) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si es admin, permitir acceso total
  if (userRol === 'admin') {
    return children;
  }

  // Verificar permiso único
  if (permiso) {
    if (!tienePermiso(permiso)) {
      return <Navigate to={redirectTo} replace />;
    }
    return children;
  }

  // Verificar múltiples permisos
  if (permisos.length > 0) {
    const cumple = requiereTodos
      ? permisos.every(p => tienePermiso(p))  // Requiere TODOS
      : permisos.some(p => tienePermiso(p));  // Requiere AL MENOS UNO
    
    if (!cumple) {
      return <Navigate to={redirectTo} replace />;
    }
    return children;
  }

  // Si no se especifica ningún permiso, permitir acceso
  return children;
}
