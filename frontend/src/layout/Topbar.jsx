import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

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
    <nav className="bg-background border-b">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-calendar-alt text-primary mr-2"></i>
            <span className="text-muted-foreground">{currentDate}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-circle text-4xl text-primary"></i>
              <div className="text-left">
                <div className="font-bold">Usuario</div>
                <small className="text-muted-foreground">Administrador</small>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
