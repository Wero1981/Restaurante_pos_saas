import { createElement, useState } from "react";
import api from '../services/api';
import { useNavigate, Link } from "react-router-dom";
import { usePOS } from '../context/POSContext';
import GoogleAuthButton from "./GoogleAuthButton";
import {
    ArrowLeft,
    ChefHat,
    Loader2,
    Lock,
    Mail,
    ReceiptText,
    ShieldCheck,
    Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import heroImage from "@/assets/landing/pos-hero.png";

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
        <div className="min-h-screen bg-gray-950 text-gray-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative hidden overflow-hidden lg:block">
                <img
                    src={heroImage}
                    alt="POS Restaurant en mostrador"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/70 to-orange-950/20" />
                <div className="relative flex h-full min-h-screen flex-col justify-between p-10 text-white">
                    <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-orange-100 hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al sitio
                    </Link>
                    <div className="max-w-xl pb-10">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-orange-50">
                            <ShieldCheck className="h-4 w-4 text-orange-300" />
                            Acceso seguro para tu operación
                        </div>
                        <h1 className="text-5xl font-bold leading-tight">
                            Entra al centro de control de tu restaurante.
                        </h1>
                        <p className="mt-5 text-lg leading-8 text-gray-200">
                            Continúa con pedidos, caja, reportes, usuarios y suscripciones desde una experiencia diseñada para trabajar rápido.
                        </p>
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <LoginMetric icon={ReceiptText} label="Pedidos" value="en vivo" />
                            <LoginMetric icon={Store} label="Sucursales" value="multi" />
                            <LoginMetric icon={ShieldCheck} label="Acceso" value="protegido" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-6 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
                            <ChefHat className="h-7 w-7 text-orange-500" />
                            POS Restaurant
                        </Link>
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/register-user">Crear cuenta</Link>
                        </Button>
                    </div>

                    <Card className="border-gray-200 shadow-xl">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-3xl font-bold">Iniciar sesión</CardTitle>
                            <CardDescription>
                                Accede con tu correo para continuar administrando tu restaurante.
                            </CardDescription>
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
                                    <Label htmlFor="email">Correo electrónico</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email" 
                                            placeholder="correo@ejemplo.com"
                                            required
                                            autoComplete="email"
                                            className="pl-10"
                                            onChange={e => setData({ ...data, email: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password" 
                                            placeholder="••••••••"
                                            required
                                            autoComplete="current-password"
                                            className="pl-10"
                                            onChange={e => setData({ ...data, password: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                
                                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" size="lg" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? "Ingresando..." : "Entrar al POS"}
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
                                    <Link to="/register-user" className="text-sm font-medium text-orange-600 hover:underline">
                                        ¿No tienes cuenta? Empieza tu prueba gratis
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                    <p className="mt-5 text-center text-xs text-gray-500">
                        Tus datos de operación se protegen por usuario, restaurante y permisos.
                    </p>
                </div>
            </section>
        </div>
    );
}

function LoginMetric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-md border border-white/10 bg-white/10 p-4 backdrop-blur">
            {createElement(Icon, { className: "h-5 w-5 text-orange-300" })}
            <p className="mt-3 text-xs uppercase text-gray-300">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}
