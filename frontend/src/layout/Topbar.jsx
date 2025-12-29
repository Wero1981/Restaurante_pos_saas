import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const navigate = useNavigate();
  
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center">
          <i className="fas fa-calendar-alt text-primary me-2"></i>
          <span className="text-muted">{currentDate}</span>
        </div>
        
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <button 
              className="btn btn-link text-decoration-none text-dark dropdown-toggle d-flex align-items-center"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="fas fa-user-circle fa-2x text-primary me-2"></i>
              <div className="text-start">
                <div className="fw-bold">Usuario</div>
                <small className="text-muted">Administrador</small>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
              <li>
                <a className="dropdown-item" href="#">
                  <i className="fas fa-user me-2"></i>Mi Perfil
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="fas fa-cog me-2"></i>Configuración
                </a>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
