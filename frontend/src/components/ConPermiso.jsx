import { usePOS } from '../context/POSContext';

/**
 * Componente para mostrar contenido condicionalmente según permisos
 * 
 * Ejemplos de uso:
 * 
 * // Permiso único
 * <ConPermiso permiso="crear_productos">
 *   <Button>Crear Producto</Button>
 * </ConPermiso>
 * 
 * // Múltiples permisos - requiere AL MENOS UNO
 * <ConPermiso permisos={['crear_pedidos', 'editar_pedidos']}>
 *   <Button>Gestionar Pedidos</Button>
 * </ConPermiso>
 * 
 * // Múltiples permisos - requiere TODOS
 * <ConPermiso permisos={['ver_reportes', 'exportar_reportes']} requiereTodos>
 *   <Button>Exportar Reporte</Button>
 * </ConPermiso>
 * 
 * // Con contenido alternativo si no tiene permiso
 * <ConPermiso 
 *   permiso="administrar_usuarios"
 *   fallback={<p className="text-gray-500">No tienes acceso</p>}
 * >
 *   <AdminPanel />
 * </ConPermiso>
 */
export function ConPermiso({ 
  permiso,           // Permiso único
  permisos = [],     // Array de permisos múltiples
  requiereTodos = false,  // Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
  children,          // Contenido a mostrar si tiene permiso
  fallback = null    // Contenido alternativo si no tiene permiso
}) {
  const { tienePermiso } = usePOS();
  
  // Si se pasa un solo permiso
  if (permiso) {
    return tienePermiso(permiso) ? children : fallback;
  }
  
  // Si se pasan múltiples permisos
  if (permisos.length > 0) {
    const cumple = requiereTodos
      ? permisos.every(p => tienePermiso(p))  // Requiere TODOS
      : permisos.some(p => tienePermiso(p));  // Requiere AL MENOS UNO
    
    return cumple ? children : fallback;
  }
  
  // Si no se especifica ningún permiso, mostrar el contenido
  return children;
}
