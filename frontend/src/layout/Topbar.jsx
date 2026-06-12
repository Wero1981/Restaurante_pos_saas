import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Expand, Shrink, LogOut, Store } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import api from '../services/api';
import Boss from '@/icons/boss';
import Mesero from '@/icons/Mesero';
import Cajero from '@/icons/Cajero';


export default function Topbar() {
  const navigate = useNavigate();
  const {
    user,
    userRol,
    setShowSidebar,
    restauranteActivo,
    seleccionarRestaurante,
    cerrarSesion,
  } = usePOS();
  const [fullScreen, setFullScreen] = useState(false);
  const [restaurantes, setRestaurantes] = useState([]);

  useEffect(() => {
    if (userRol !== 'admin') {
      return;
    }

    const cargarRestaurantes = async () => {
      try {
        const response = await api.get('/restaurantes/');
        setRestaurantes(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error cargando restaurantes en la barra superior:', error);
        setRestaurantes([]);
      }
    };

    cargarRestaurantes();
  }, [userRol]);
  
  const handleLogout = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  const handleRestauranteChange = (event) => {
    const restauranteId = Number(event.target.value);
    const restaurante = restaurantes.find((item) => item.id === restauranteId);

    if (restaurante) {
      seleccionarRestaurante(restaurante);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullScreen(true);
      setShowSidebar(false);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
        setShowSidebar(true);
      }
    }
  }

  return (
    <nav className="bg-background border-b">
      <div className="px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center min-w-0">
            {userRol === 'admin' ? (
              <label className="flex items-center gap-2 min-w-0">
                <Store className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="sr-only">Restaurante activo</span>
                <select
                  value={restauranteActivo?.id || ''}
                  onChange={handleRestauranteChange}
                  className="h-9 max-w-64 rounded-md border border-input bg-background px-3 text-sm font-semibold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="" disabled>
                    Selecciona un restaurante
                  </option>
                  {restaurantes.map((restaurante) => (
                    <option key={restaurante.id} value={restaurante.id}>
                      {restaurante.nombre}
                    </option>
                  ))}
                </select>
              </label>
            ) : restauranteActivo ? (
              <span className="flex items-center gap-2 text-orange-500 font-semibold">
                <Store className="w-5 h-5" />
                {restauranteActivo.nombre}
              </span>
            ) : null}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-circle text-4xl text-primary"></i>
              <div className="text-left">
                <div className="font-bold">
                  {userRol === 'admin' && (
                    <Boss className="inline-block w-5 h-5 mr-1" />
                  )}
                  {userRol === 'mesero' && (
                    <Mesero className="inline-block w-5 h-5 text-orange-500 mr-1 pb-1" />
                  )}
                  {userRol === 'cajero' && (
                    <Cajero className="inline-block w-8 h-6 text-green-500 mr-1 pb-1" />
                  )}
                  
                  {user?.nombre || 'Usuario'}

                </div>
              </div>
            </div>
            {/* Logout */}
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
                  
            {/* fullScreen */}
            <Button
              onClick={toggleFullScreen}
              variant="ghost"
            >
              {fullScreen ? (
                <Shrink className="w-5 h-5" />
              ) : (
                <Expand className="w-5 h-5" />
              )}
            </Button>

          </div>
        </div>
      </div>
    </nav>
  );
}
