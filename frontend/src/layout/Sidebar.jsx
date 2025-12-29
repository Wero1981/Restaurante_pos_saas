import { Link, useLocation, useNavigate } from 'react-router-dom';

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
    <div className="bg-dark text-white vh-100 d-flex flex-column" style={{ width: 250 }}>
      <div className="p-3 border-bottom border-secondary">
        <h4 className="mb-0">
          <i className="fas fa-utensils me-2"></i>
          POS Restaurant
        </h4>
      </div>
      
      <nav className="flex-grow-1 p-3">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              <Link 
                className={`nav-link text-white rounded d-flex align-items-center p-3 ${
                  location.pathname === item.path ? 'bg-primary' : 'hover-bg-secondary'
                }`}
                to={item.path}
              >
                <i className={`fas ${item.icon} me-3`}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-3 border-top border-secondary">
        <button onClick={handleLogout} className="btn btn-outline-light w-100">
          <i className="fas fa-sign-out-alt me-2"></i>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}