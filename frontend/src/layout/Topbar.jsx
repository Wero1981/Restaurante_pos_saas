import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, Expand, Shrink, LogOut, Crown, Utensils, Wallet, UserCog } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import Boss from '@/icons/boss';
import Mesero from '@/icons/Mesero';
import Cajero from '@/icons/Cajero';


export default function Topbar() {
  const navigate = useNavigate();
  const { user, userRol, setShowSidebar } = usePOS();
  const [fullScreen, setFullScreen] = useState(false);

  
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
          <div className="flex items-center">
            <i className="fas fa-calendar-alt text-primary mr-2"></i>
            <span className="text-muted-foreground">{currentDate}</span>
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
