import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function SinPermiso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            {/* Icono */}
            <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-orange-600" />
            </div>
            
            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Acceso Denegado
            </h1>
            
            {/* Descripción */}
            <p className="text-gray-600 mb-2">
              No tienes permisos para acceder a esta sección
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Si crees que esto es un error, contacta con el administrador del restaurante
            </p>
            
            {/* Botones */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver Atrás
              </Button>
              
              <Button 
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
