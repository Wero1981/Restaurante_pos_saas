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
  Table 
} from 'lucide-react';
import { ConPermiso } from '@/components/ConPermiso';


export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRol } = usePOS();
  const [collapsed, setCollapsed] = useState(false);
  
  const menuItems = [ 
    { path: '/productos', icon: Package, label: 'Productos' },
    { path: '/inventario', icon: Warehouse, label: 'Inventario' },
    { path: '/mesas', icon: LayoutGrid, label: 'Mesas' },
    { path: '/usuarios', icon: Users, label: 'Usuarios' },
    { path: '/caja', icon: CreditCard, label: 'Caja' },
    ...(userRol === 'admin' ? [
      { path: '/restaurantes', icon: Store, label: 'Restaurantes' },
      { path: '/restaurante', icon: Settings, label: 'Configuración' }
    ] : [])
  ];
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  
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
            return (
              <li key={item.path}>
                <Link 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    location.pathname === item.path 
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' 
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  } ${
                    collapsed ? 'justify-center' : ''
                  }`}
                  to={item.path}
                  title={collapsed ? item.label : ''}
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
            );
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