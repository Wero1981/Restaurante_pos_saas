import { useState } from "react";
import api from '../services/api';
import { useNavigate, Link } from "react-router-dom";
import { usePOS } from '../context/POSContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
    const [data, setData] = useState({});
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { cargarUsuarioYPermisos } = usePOS();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post('/usuarios/login/', data);
            
            // Guardar token
            localStorage.setItem('token', response.data.access);
            
            // Guardar información del usuario (ya incluye rol y permisos)
            const userInfo = response.data.user;
            localStorage.setItem('user', JSON.stringify(userInfo));
            
            // Guardar ID del restaurante si existe
            if (userInfo.restaurante_id) {
                localStorage.setItem('restaurante_id', userInfo.restaurante_id);
            }
            
         
            // Cargar permisos del usuario en el contexto
            await cargarUsuarioYPermisos();
            let rol = userInfo.rol;
            
            switch (rol) {
                case 'admin':
                    navigate('/restaurantes');
                    break;
                case 'mesero':
                    navigate('/mesas');
                    break;
                case 'cocinero':
                    navigate('/ordenes');
                    break;
                case 'cajero':
                    navigate('/caja');
                    break;
                default:
                    navigate('/sin-permiso');
            }
        } catch (error) {
            console.error("Login failed:", error);
            setError("Email o contraseña incorrectos");
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md px-6">
                <Card>
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <i className="fas fa-utensils text-5xl text-primary mb-3"></i>
                        <CardTitle className="text-3xl font-bold">POS Restaurant</CardTitle>
                        <CardDescription>Inicia sesión para continuar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    <i className="fas fa-envelope mr-2"></i>Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email" 
                                    placeholder="correo@ejemplo.com"
                                    required
                                    onChange={e => setData({ ...data, email: e.target.value })} 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    <i className="fas fa-lock mr-2"></i>Contraseña
                                </Label>
                                <Input
                                    id="password"
                                    type="password" 
                                    placeholder="••••••••"
                                    required
                                    onChange={e => setData({ ...data, password: e.target.value })} 
                                />
                            </div>
                            
                            <Button type="submit" className="w-full" size="lg">
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Iniciar Sesión
                            </Button>
                            
                            <div className="text-center">
                                <Link to="/register-user" className="text-sm text-primary hover:underline">
                                    ¿No tienes cuenta? Regístrate aquí
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}