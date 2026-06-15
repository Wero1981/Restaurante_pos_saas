import { useState } from "react";
import api from '../services/api';
import { useNavigate, Link } from "react-router-dom";
import { usePOS } from '../context/POSContext';
import GoogleAuthButton from "./GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
    const [data, setData] = useState({});
    const [error, setError] = useState("");
    const [unverifiedEmail, setUnverifiedEmail] = useState("");
    const [resendMessage, setResendMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { cargarUsuarioYPermisos } = usePOS();

    const guardarSesion = async (response) => {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        const userInfo = response.data.user;
        localStorage.setItem('user', JSON.stringify(userInfo));

        if (userInfo.restaurante_id) {
            localStorage.setItem('restaurante_id', userInfo.restaurante_id);
            localStorage.setItem('restauranteActivo', JSON.stringify({
                id: userInfo.restaurante_id,
                nombre: userInfo.restaurante_nombre,
                slug: userInfo.restaurante_slug,
            }));
        }

        await cargarUsuarioYPermisos();

        const rutas = {
            'admin': '/restaurantes',
            'mesero': '/mesas',
            'cocinero': '/ordenes',
            'cajero': '/caja'
        };

        navigate(rutas[userInfo.rol] || '/sin-permiso');
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setUnverifiedEmail("");
        setResendMessage("");
        setIsLoading(true);
        try {
            const response = await api.post('/usuarios/login/', data);
            
            await guardarSesion(response);
            
        } catch (error) {
            console.error("Login failed:", error);
            if (error.response?.data?.code === "email_not_verified") {
                setError(error.response.data.detail);
                setUnverifiedEmail(error.response.data.email || data.email);
            } else {
                setError("Email o contraseña incorrectos");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const reenviarVerificacion = async () => {
        setResendMessage("");
        setIsLoading(true);
        try {
            const response = await api.post("/usuarios/reenviar-verificacion/", {
                email: unverifiedEmail,
            });
            setResendMessage(response.data.detail);
        } catch (error) {
            console.error("Resend verification failed:", error);
            setResendMessage("No se pudo reenviar el correo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        setError("");
        setIsLoading(true);
        try {
            const response = await api.post('/usuarios/login-google/', {
                credential: credentialResponse.credential
            });

            await guardarSesion(response);

        } catch (error) {
            console.error("Google Login failed:", error);
            if (error.response?.status === 404) {
                setError("Esta cuenta aún no está registrada. Crea tu cuenta con Google.");
            } else {
                setError(error.response?.data?.detail || "Error al iniciar sesión con Google");
            }
        } finally {
            setIsLoading(false);
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
                        {unverifiedEmail && (
                            <div className="mb-4 space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={reenviarVerificacion}
                                    disabled={isLoading}
                                >
                                    Reenviar correo de verificación
                                </Button>
                                {resendMessage && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {resendMessage}
                                    </p>
                                )}
                            </div>
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
                            
                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
                            </Button>

                            <div className="flex items-center gap-3 py-1">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs uppercase text-muted-foreground">o</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <GoogleAuthButton
                                onSuccess={handleGoogleLogin}
                                onError={setError}
                                text="signin_with"
                                disabled={isLoading}
                            />

                            <div className="text-center space-y-2">
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
