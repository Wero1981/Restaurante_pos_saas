import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { usePOS } from '@/context/POSContext';
import { 
  Utensils, 
  Package, 
  Warehouse, 
  LayoutGrid, 
  Users, 
  CreditCard, 
  Store, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Table,
  ArrowDownUp,
  ArrowDownCircle,
  BadgeDollarSign,
  BarChart3,
  Factory,
} from 'lucide-react';


export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRol, cerrarSesion, suscripcionBloqueada } = usePOS();
  const [collapsed, setCollapsed] = useState(false);
  
  const menuItems = [
    ...(userRol === 'mesero' || userRol === 'admin' ? [
      {path: '/mesas', icon: Table, label: 'Mesas', treeview: false },
    ] : []),
    ...(userRol === 'admin' || userRol === 'cocinero' ? [
      {path: '/ordenes', icon: LayoutGrid, label: 'Órdenes', treeview: false },

    ] : []),
    ...(userRol === 'admin' || userRol === 'cajero' ? [
      {path: '/caja', icon: CreditCard, label: 'Caja', treeview: false },
      {path: '/inventario/movimientos', icon: Package, label: 'Movimientos', treeview: true },
    ] : []),
    ...(userRol === 'admin' ? [
      { path: '/restaurantes', icon: Store, label: 'Restaurantes', treeview: false },
      { path: '/estaciones', icon: Factory, label: 'Estaciones', treeview: false },
      {path: '/usuarios', icon: Users, label: 'Usuarios', treeview: false },
      {path: '/reportes', icon: BarChart3, label: 'Reportes', treeview: false },
      {path: '/suscripcion', icon: BadgeDollarSign, label: 'Suscripción', treeview: false },
      { path: '/restaurante', icon: Settings, label: 'Configuración', treeview: false }
    ] : [])
  ];
  
  const handleLogout = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  const bloqueoClass = 'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-gray-300 hover:translate-x-0';
  const isItemBloqueado = (path) => suscripcionBloqueada && path !== '/suscripcion';
  
  return (
    <div className={`bg-gradient-to-b from-gray-900 to-gray-950 text-white h-screen flex flex-col shadow-2xl transition-all duration-300 relative ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header con logo */}
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className={`flex items-center gap-3 ${
          collapsed ? 'justify-center' : ''
        }`}>
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h4 className="text-lg font-bold tracking-wide">POS Restaurant</h4>
              <p className="text-xs text-orange-100 opacity-90">Sistema de Gestión</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Botón para colapsar/expandir */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-full p-1.5 shadow-lg hover:shadow-orange-500/50 transition-all duration-200 hover:scale-110 z-10"
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
      
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const bloqueado = isItemBloqueado(item.path);
            return (
              item.treeview ? (
                <li key={item.path}>  
                  <details className="group">
                    <summary
                      onClick={(event) => {
                        if (bloqueado) event.preventDefault();
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                        : bloqueado
                          ? bloqueoClass
                          : 'cursor-pointer text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                    } ${
                      collapsed ? 'justify-center' : ''
                    }`}
                      title={bloqueado ? 'Renueva tu suscripción para acceder' : ''}
                    >
                      <div className={`w-5 h-5 flex items-center justify-center rounded-md ${
                        location.pathname.startsWith(item.path)
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-800/40 text-gray-400'
                      }`}>
                        <ChevronRight className="w-3 h-3 group-open:hidden" />
                        <ChevronLeft className="hidden w-3 h-3 group-open:block" />
                      </div>
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                        location.pathname.startsWith(item.path)
                          ? 'bg-white/10' 
                          : 'bg-gray-800/50'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </summary>
                    <ul className="mt-2 space-y-1 pl-11">
                      <li>
                        <Link to="/inventario"
                          onClick={(event) => {
                            if (bloqueado) event.preventDefault();
                          }}
                          aria-disabled={bloqueado}
                          title={bloqueado ? 'Renueva tu suscripción para acceder' : ''}
                          className={`block p-2 rounded-lg transition-all duration-200 ${
                            location.pathname === '/inventario'
                              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                              : bloqueado
                                ? bloqueoClass
                                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4" />
                            Inventario
                          </span>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/inventario/movimientos-entrada" 
                          onClick={(event) => {
                            if (bloqueado) event.preventDefault();
                          }}
                          aria-disabled={bloqueado}
                          title={bloqueado ? 'Renueva tu suscripción para acceder' : ''}
                          className={`block p-2 rounded-lg transition-all duration-200 ${
                            location.pathname === '/inventario/movimientos-entrada'
                              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                              : bloqueado
                                ? bloqueoClass
                                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowDownUp  className="w-4 h-4" />
                            Movimientos
                          </span>
                        </Link>
                      </li>
                    </ul>
                  </details>
  
                </li>
              ) : (
              <li key={item.path}>
                <Link 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    location.pathname === item.path 
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                      : bloqueado
                        ? bloqueoClass
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  } ${
                    collapsed ? 'justify-center' : ''
                  }`}
                  to={item.path}
                  onClick={(event) => {
                    if (bloqueado) event.preventDefault();
                  }}
                  aria-disabled={bloqueado}
                  title={bloqueado ? 'Renueva tu suscripción para acceder' : collapsed ? item.label : ''}
                >
                
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                    location.pathname === item.path 
                      ? 'bg-white/10' 
                      : 'bg-gray-800/50'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))
          })}
       

        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700/50 bg-gray-950/50">
        <Button 
          onClick={handleLogout} 
          variant="outline"
          className="w-full border-gray-700 bg-gray-800/50 text-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-200 group"
          title={collapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className={`w-4 h-4 group-hover:rotate-12 transition-transform ${
            collapsed ? '' : 'mr-2'
          }`} />
          {!collapsed && 'Cerrar Sesión'}
        </Button>
      </div>
    </div>
  );
}
