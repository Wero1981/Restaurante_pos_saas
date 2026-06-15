import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePOS } from "../context/POSContext";
import GoogleAuthButton from "./GoogleAuthButton";

export default function RegisterUser() {
    const [ form, setForm ] = useState({});
    const [error, setError] = useState("");
    const [registroPendiente, setRegistroPendiente] = useState(null);
    const [mensajeReenvio, setMensajeReenvio] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { cargarUsuarioYPermisos } = usePOS();

    const guardarSesion = async (res) => {
        localStorage.setItem("token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (res.data.user.restaurante_id) {
            const restaurante = {
                id: res.data.user.restaurante_id,
                nombre: res.data.user.restaurante_nombre,
                slug: res.data.user.restaurante_slug,
            };
            localStorage.setItem("restaurante_id", String(restaurante.id));
            localStorage.setItem("restauranteActivo", JSON.stringify(restaurante));
        }

        await cargarUsuarioYPermisos();
        navigate("/restaurantes");
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await api.post("/usuarios/registro/", form);
            setRegistroPendiente({
                email: res.data.email,
                detail: res.data.detail,
            });
        } catch (error) {
            console.error(error);
            const apiError = error.response?.data;
            setError(
                apiError?.detail
                || apiError?.email?.[0]
                || "No se pudo crear la cuenta."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const reenviarVerificacion = async () => {
        setMensajeReenvio("");
        setIsLoading(true);
        try {
            const response = await api.post("/usuarios/reenviar-verificacion/", {
                email: registroPendiente.email,
            });
            setMensajeReenvio(response.data.detail);
        } catch (error) {
            console.error("Resend verification failed:", error);
            setMensajeReenvio("No se pudo reenviar el correo. Intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async (credentialResponse) => {
        if (!form.restaurante_nombre?.trim()) {
            setError("Escribe el nombre de tu restaurante antes de continuar con Google.");
            return;
        }

        setError("");
        setIsLoading(true);
        try {
            const res = await api.post("/usuarios/login-google/", {
                credential: credentialResponse.credential,
                restaurante_nombre: form.restaurante_nombre.trim(),
            });
            await guardarSesion(res);
        } catch (error) {
            console.error("Google register failed:", error);
            setError(error.response?.data?.detail || "No se pudo crear la cuenta con Google.");
        } finally {
            setIsLoading(false);
        }
    };

    if (registroPendiente) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <i className="fas fa-envelope-circle-check text-5xl text-primary mb-3"></i>
                        <CardTitle>Revisa tu correo</CardTitle>
                        <CardDescription>{registroPendiente.detail}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="font-medium">{registroPendiente.email}</p>
                        {mensajeReenvio && (
                            <Alert>
                                <AlertDescription>{mensajeReenvio}</AlertDescription>
                            </Alert>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={reenviarVerificacion}
                            disabled={isLoading}
                        >
                            {isLoading ? "Enviando..." : "Reenviar correo"}
                        </Button>
                        <Link to="/login" className="block text-sm text-primary hover:underline">
                            Ir al inicio de sesión
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-6xl mx-auto p-4">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Imagen lateral - oculta en móviles */}
                            <div className="hidden md:flex bg-gradient-to-br from-primary to-primary/80 p-12 flex-col justify-center items-center text-white">
                                <div className="text-center space-y-6">
                                    <i className="fas fa-utensils text-8xl opacity-90"></i>
                                    <h2 className="text-4xl font-bold">POS Restaurant</h2>
                                    <p className="text-lg opacity-90">Gestiona tu restaurante de manera profesional</p>
                                    <div className="space-y-4 text-left mt-8">
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-check-circle text-2xl"></i>
                                            <span>Control total de ventas</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-check-circle text-2xl"></i>
                                            <span>Gestión de mesas y pedidos</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-check-circle text-2xl"></i>
                                            <span>Inventario en tiempo real</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-check-circle text-2xl"></i>
                                            <span>Reportes detallados</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Formulario */}
                            <div className="p-8 md:p-12">
                                <div className="mb-8 text-center md:text-left">
                                    <div className="md:hidden mb-4">
                                        <i className="fas fa-user-plus text-5xl text-primary"></i>
                                    </div>
                                    <CardTitle className="text-3xl mb-2">Crear Cuenta</CardTitle>
                                    <CardDescription className="text-base">
                                        Completa el formulario para registrar tu cuenta y restaurante
                                    </CardDescription>
                                </div>
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">
                                            <i className="fas fa-id-card mr-2 text-primary"></i>Nombre Completo
                                        </Label>
                                        <Input
                                            id="nombre"
                                            placeholder="Juan Pérez"
                                            required
                                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                                        />
                                    </div>
                        
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            <i className="fas fa-envelope mr-2 text-primary"></i>Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                            required
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                        
                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            <i className="fas fa-lock mr-2 text-primary"></i>Contraseña
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                        />
                                    </div>
                        
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurante">
                                            <i className="fas fa-store mr-2 text-primary"></i>Nombre del Restaurante
                                        </Label>
                                        <Input
                                            id="restaurante"
                                            placeholder="Mi Restaurante"
                                            required
                                            onChange={e => setForm({ ...form, restaurante_nombre: e.target.value })}
                                        />
                                    </div>
                        
                                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                        <i className="fas fa-check mr-2"></i>
                                        {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                                    </Button>

                                    <div className="flex items-center gap-3 py-1">
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-xs uppercase text-muted-foreground">o</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>

                                    <GoogleAuthButton
                                        onSuccess={handleGoogleRegister}
                                        onError={setError}
                                        text="signup_with"
                                        disabled={isLoading}
                                    />

                                    <div className="text-center text-sm text-muted-foreground">
                                        ¿Ya tienes cuenta?{" "}
                                        <Link to="/login" className="text-primary hover:underline font-medium">
                                            Inicia sesión aquí
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
