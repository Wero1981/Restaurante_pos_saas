import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { path: '/productos', icon: 'fa-box', label: 'Productos' },
    { path: '/mesas', icon: 'fa-table', label: 'Mesas' },
    { path: '/caja', icon: 'fa-cash-register', label: 'Caja' },
    { path: '/restaurante', icon: 'fa-store', label: 'Restaurante' }
  ];
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  
  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col w-64">
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-xl font-bold">
          <i className="fas fa-utensils mr-2"></i>
          POS Restaurant
        </h4>
      </div>
      
      <nav className="flex-grow p-3">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                to={item.path}
              >
                <i className={`fas ${item.icon} mr-3`}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-gray-700">
        <Button 
          onClick={handleLogout} 
          variant="outline"
          className="w-full border-gray-600 text-white hover:bg-gray-800"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}