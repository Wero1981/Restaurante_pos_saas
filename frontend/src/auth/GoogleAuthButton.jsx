import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

export default function GoogleAuthButton({
    onSuccess,
    onError,
    text = "continue_with",
    disabled = false,
}) {
    const buttonRef = useRef(null);
    const successRef = useRef(onSuccess);
    const errorRef = useRef(onError);
    const [sdkReady, setSdkReady] = useState(Boolean(window.google?.accounts?.id));
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        successRef.current = onSuccess;
        errorRef.current = onError;
    }, [onError, onSuccess]);

    useEffect(() => {
        if (!clientId) {
            errorRef.current?.("Falta configurar VITE_GOOGLE_CLIENT_ID.");
            return undefined;
        }

        const initializeGoogle = () => setSdkReady(true);

        if (window.google?.accounts?.id) {
            initializeGoogle();
            return undefined;
        }

        let script = document.getElementById(GOOGLE_SCRIPT_ID);
        if (!script) {
            script = document.createElement("script");
            script.id = GOOGLE_SCRIPT_ID;
            script.src = GOOGLE_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        script.addEventListener("load", initializeGoogle);
        const handleError = () => errorRef.current?.("No se pudo cargar Google.");
        script.addEventListener("error", handleError);

        return () => {
            script.removeEventListener("load", initializeGoogle);
            script.removeEventListener("error", handleError);
        };
    }, [clientId]);

    useEffect(() => {
        if (!sdkReady || !buttonRef.current || disabled) {
            return;
        }

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => successRef.current?.(response),
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text,
            shape: "rectangular",
            logo_alignment: "left",
            width: Math.min(buttonRef.current.offsetWidth || 320, 400),
        });
    }, [clientId, disabled, sdkReady, text]);

    if (!clientId) {
        return (
            <p className="text-center text-sm text-muted-foreground">
                Acceso con Google no configurado.
            </p>
        );
    }

    return (
        <div
            ref={buttonRef}
            className={`flex min-h-10 w-full justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={disabled}
        />
    );
}
