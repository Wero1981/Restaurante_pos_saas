from django.conf import settings
from django.core import signing
from django.core.mail import send_mail


SALT = "usuarios.verificacion-email"
MAX_AGE = 60 * 60 * 24


def generar_token(usuario):
    return signing.dumps(
        {
            "user_id": usuario.id,
            "email": usuario.email,
        },
        salt=SALT,
    )


def validar_token(token):
    return signing.loads(
        token,
        salt=SALT,
        max_age=MAX_AGE,
    )


def enviar_verificacion(usuario):
    token = generar_token(usuario)
    enlace = f"{settings.FRONTEND_URL}/verificar-correo?token={token}"

    send_mail(
        subject="Verifica tu correo",
        message=(
            "Gracias por crear tu cuenta en POS Restaurant.\n\n"
            f"Verifica tu correo desde este enlace:\n{enlace}\n\n"
            "El enlace vence en 24 horas."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
    )
