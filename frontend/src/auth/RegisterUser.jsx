import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterUser() {
    const [ form, setForm ] = useState({});
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/usuarios/registro/", form);
            localStorage.setItem("token", res.data.access);
            navigate("/restaurante");
        } catch (error) {
            console.error(error);
        }
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
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            <i className="fas fa-user mr-2 text-primary"></i>Usuario
                                        </Label>
                                        <Input
                                            id="username"
                                            placeholder="usuario123"
                                            required
                                            onChange={e => setForm({ ...form, username: e.target.value })}
                                        />
                                    </div>
                        
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
                        
                                    <Button type="submit" className="w-full" size="lg">
                                        <i className="fas fa-check mr-2"></i>
                                        Crear Cuenta
                                    </Button>
                                    <div className="text-center text-sm text-muted-foreground">
                                        ¿Ya tienes cuenta?{" "}
                                        <a href="/" className="text-primary hover:underline font-medium">
                                            Inicia sesión aquí
                                        </a>
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