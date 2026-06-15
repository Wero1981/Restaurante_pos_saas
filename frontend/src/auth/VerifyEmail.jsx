import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../services/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verificando tu correo...");
    const [email, setEmail] = useState("");
    const [resendMessage, setResendMessage] = useState("");
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("El enlace no contiene un token de verificación.");
            return;
        }

        api.post("/usuarios/verificar-correo/", { token })
            .then((response) => {
                setStatus("success");
                setMessage(response.data.detail);
            })
            .catch((error) => {
                setStatus("error");
                setMessage(
                    error.response?.data?.detail
                    || "No se pudo verificar el correo."
                );
            });
    }, [token]);

    const reenviarVerificacion = async (event) => {
        event.preventDefault();
        setResendMessage("");
        setIsResending(true);
        try {
            const response = await api.post("/usuarios/reenviar-verificacion/", {
                email,
            });
            setResendMessage(response.data.detail);
        } catch (error) {
            console.error("Resend verification failed:", error);
            setResendMessage("No se pudo reenviar el correo.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <i className={`fas ${
                        status === "success"
                            ? "fa-circle-check text-green-600"
                            : status === "error"
                                ? "fa-circle-exclamation text-destructive"
                                : "fa-spinner fa-spin text-primary"
                    } text-5xl mb-3`}></i>
                    <CardTitle>Verificación de correo</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "success" && (
                        <Link
                            to="/login"
                            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Iniciar sesión
                        </Link>
                    )}

                    {status === "error" && (
                        <form onSubmit={reenviarVerificacion} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="verification-email">Correo electrónico</Label>
                                <Input
                                    id="verification-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={isResending}
                            >
                                {isResending ? "Enviando..." : "Enviar un nuevo enlace"}
                            </Button>
                            {resendMessage && (
                                <Alert>
                                    <AlertDescription>{resendMessage}</AlertDescription>
                                </Alert>
                            )}
                            <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                                Volver al inicio de sesión
                            </Link>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
