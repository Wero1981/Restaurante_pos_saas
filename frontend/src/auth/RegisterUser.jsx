import { createElement, useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    ChefHat,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    ReceiptText,
    ShieldCheck,
    Store,
    Users,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePOS } from "../context/POSContext";
import GoogleAuthButton from "./GoogleAuthButton";
import heroImage from "@/assets/landing/pos-hero.png";

export default function RegisterUser() {
    const [ form, setForm ] = useState({});
    const [error, setError] = useState("");
    const [ showPassword, setShowPassword ] = useState(false);
    const [registroPendiente, setRegistroPendiente] = useState(null);
    const [mensajeReenvio, setMensajeReenvio] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { cargarUsuarioYPermisos } = usePOS();
    const password = form.password || "";
    const passwordRules = [
        {
            label: "Mínimo 10 caracteres",
            valid: password.length >= 10,
        },
        {
            label: "Una letra mayúscula",
            valid: /[A-ZÁÉÍÓÚÑ]/.test(password),
        },
        {
            label: "Una letra minúscula",
            valid: /[a-záéíóúñ]/.test(password),
        },
        {
            label: "Un número",
            valid: /\d/.test(password),
        },
        {
            label: "Un símbolo",
            valid: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(password),
        },
    ];
    const passwordIsStrong = passwordRules.every((rule) => rule.valid);
    

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

        if (!passwordIsStrong) {
            setError("La contraseña no cumple con todos los requisitos de seguridad.");
            return;
        }

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
                || apiError?.password?.[0]
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
            <div className="flex min-h-screen items-center justify-center bg-gray-950 px-5 py-10">
                <Card className="w-full max-w-md border-gray-200 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                            <Mail className="h-7 w-7 text-orange-600" />
                        </div>
                        <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
                        <CardDescription>{registroPendiente.detail}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="rounded-md bg-gray-50 px-3 py-2 font-medium">{registroPendiente.email}</p>
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
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Enviando..." : "Reenviar correo"}
                        </Button>
                        <Link to="/login" className="block text-sm font-medium text-orange-600 hover:underline">
                            Ir al inicio de sesión
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-950 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
            <section className="relative hidden overflow-hidden lg:block">
                <img
                    src={heroImage}
                    alt="POS Restaurant para crear cuenta"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/75 to-orange-950/20" />
                <div className="relative flex h-full min-h-screen flex-col justify-between p-10 text-white">
                    <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-orange-100 hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al sitio
                    </Link>
                    <div className="max-w-xl pb-10">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-orange-50">
                            <ShieldCheck className="h-4 w-4 text-orange-300" />
                            Prueba gratuita con verificación por correo
                        </div>
                        <h1 className="text-5xl font-bold leading-tight">
                            Crea tu cuenta y registra tu restaurante en minutos.
                        </h1>
                        <p className="mt-5 text-lg leading-8 text-gray-200">
                            Empieza con mesas, pedidos, caja, reportes y usuarios desde el primer día.
                        </p>
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <RegisterMetric icon={ReceiptText} label="Ventas" value="control" />
                            <RegisterMetric icon={Users} label="Equipo" value="roles" />
                            <RegisterMetric icon={Store} label="Sucursal" value="lista" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-8">
                <div className="w-full max-w-lg">
                    <div className="mb-6 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
                            <ChefHat className="h-7 w-7 text-orange-500" />
                            POS Restaurant
                        </Link>
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/login">Entrar</Link>
                        </Button>
                    </div>

                    <Card className="border-gray-200 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-3xl">Crear cuenta</CardTitle>
                            <CardDescription>
                                Registra tu cuenta principal y el nombre de tu restaurante.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <form onSubmit={submit} className="space-y-4">
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
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                        
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Contraseña</Label>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Mínimo 10 caracteres"
                                                required
                                                autoComplete="new-password"
                                                className="pl-10 pr-10"
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                            />

                                            <button
                                                type="button"
                                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-orange-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1 rounded-md border bg-gray-50 p-2 text-left text-xs sm:grid-cols-2">
                                            {passwordRules.map((rule) => (
                                                <div
                                                    key={rule.label}
                                                    className={rule.valid ? "flex items-center gap-2 text-green-700" : "flex items-center gap-2 text-gray-500"}
                                                >
                                                    {rule.valid ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4" />
                                                    )}
                                                    <span>{rule.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurante">Nombre del restaurante</Label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="restaurante"
                                                placeholder="Mi Restaurante"
                                                required
                                                className="pl-10"
                                                onChange={e => setForm({ ...form, restaurante_nombre: e.target.value })}
                                            />
                                        </div>
                                    </div>
                        
                                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" size="lg" disabled={isLoading || !passwordIsStrong}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                                        <Link to="/login" className="font-medium text-orange-600 hover:underline">
                                            Inicia sesión aquí
                                        </Link>
                                    </div>
                                </form>
                        </CardContent>
                    </Card>
                    <p className="mt-5 text-center text-xs text-gray-500">
                        Tu correo debe verificarse antes de iniciar sesión.
                    </p>
                </div>
            </section>
        </div>
    );
}

function RegisterMetric({ icon: Icon, label, value }) {
    return (
        <div className="rounded-md border border-white/10 bg-white/10 p-4 backdrop-blur">
            {createElement(Icon, { className: "h-5 w-5 text-orange-300" })}
            <p className="mt-3 text-xs uppercase text-gray-300">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}
