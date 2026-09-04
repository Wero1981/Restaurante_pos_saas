from django.conf import settings
from django.contrib.auth import authenticate
from django.core.signing import BadSignature, SignatureExpired
from django.db import transaction
from drf_spectacular.utils import extend_schema
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .email_verification import enviar_verificacion, validar_token
from .models import Usuario
from .serializers import RegistroSerializer, crear_restaurante_para_usuario


def construir_datos_usuario(user):
    from restaurantes.models import UsuarioRestaurante

    relacion = (
        UsuarioRestaurante.objects.filter(usuario=user, activo=True)
        .select_related("restaurante")
        .prefetch_related("permisos")
        .first()
    )
    user_data = {
        "id": user.id,
        "email": user.email,
        "nombre": user.nombre,
        "apellido": user.apellidoP,
        "email_verificado":user.email_verificado,
    }

    if relacion:
        user_data.update({
            "rol": relacion.rol,
            "restaurante_id": relacion.restaurante.id,
            "restaurante_nombre": relacion.restaurante.nombre,
            "restaurante_slug": relacion.restaurante.slug,
            "permisos": [
                {
                    "id": permiso.id,
                    "codigo": permiso.codigo,
                    "descripcion": permiso.descripcion,
                }
                for permiso in relacion.permisos.all()
            ],
            "estaciones": [
                {
                    "id": estacion.id,
                    "nombre": estacion.nombre,
                }
                for estacion in relacion.estaciones.filter(activa=True)
            ],
        })

    return user_data


def construir_sesion(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": construir_datos_usuario(user),
    }


class LoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    @extend_schema(
        request={"type": "object", "properties": {
            "email": {"type": "string"},
            "password": {"type": "string"},
        }},
        responses={200: {"type": "object", "properties": {
            "access": {"type": "string"},
            "refresh": {"type": "string"},
            "user": {"type": "object"},
        }}},
    )
    def post(self, request):
        user = authenticate(
            email=request.data.get("email"),
            password=request.data.get("password"),
        )

        if user is None:
            return Response(
                {"detail": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.email_verificado:
            return Response(
                {
                    "detail": "Debes verificar tu correo electrónico.",
                    "code": "email_not_verified",
                    "email": user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(construir_sesion(user))


class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        credential = request.data.get("credential")
        restaurante_nombre = request.data.get("restaurante_nombre", "").strip()

        if not credential:
            return Response(
                {"detail": "Google no devolvió una credencial válida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            datos = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except (ValueError, GoogleAuthError):
            return Response(
                {"detail": "La credencial de Google no es válida."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = datos.get("email")
        google_id = datos.get("sub")
        if not email or not google_id or not datos.get("email_verified"):
            return Response(
                {"detail": "Google no confirmó el correo electrónico."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = Usuario.objects.filter(email__iexact=email).first()
        if user is None and not restaurante_nombre:
            return Response(
                {"detail": "Esta cuenta aún no está registrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user is None:
            user = Usuario.objects.create_user(
                email=email,
                nombre=datos.get("given_name") or datos.get("name") or email.split("@")[0],
                password=None,
                google_id=google_id,
                email_verificado=True,
            )
            crear_restaurante_para_usuario(user, restaurante_nombre)
        else:
            if user.google_id and user.google_id != google_id:
                return Response(
                    {"detail": "El correo ya está vinculado con otra cuenta de Google."},
                    status=status.HTTP_409_CONFLICT,
                )

            campos_actualizados = []
            if not user.google_id:
                user.google_id = google_id
                campos_actualizados.append("google_id")
            if not user.email_verificado:
                user.email_verificado = True
                campos_actualizados.append("email_verificado")
            if not user.nombre and datos.get("given_name"):
                user.nombre = datos["given_name"]
                campos_actualizados.append("nombre")
            if campos_actualizados:
                user.save(update_fields=campos_actualizados)

            if restaurante_nombre and not construir_datos_usuario(user).get("restaurante_id"):
                crear_restaurante_para_usuario(user, restaurante_nombre)

        if not user.is_active:
            return Response(
                {"detail": "La cuenta está desactivada."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(construir_sesion(user))


class RegistroUsuarioView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    @extend_schema(request=RegistroSerializer)
    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        user.email_verificado = False
        user.save(update_fields=["email_verificado"])
        enviar_verificacion(user)

        return Response(
            {
                "detail": "Cuenta creada. Revisa tu correo para verificarla.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerificarCorreoView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "El token es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            datos = validar_token(token)
        except SignatureExpired:
            return Response(
                {
                    "detail": "El enlace de verificación ha vencido.",
                    "code": "token_expired",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except BadSignature:
            return Response(
                {
                    "detail": "El enlace de verificación no es válido.",
                    "code": "invalid_token",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = Usuario.objects.filter(
            id=datos.get("user_id"),
            email__iexact=datos.get("email"),
        ).first()
        if not user:
            return Response(
                {"detail": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not user.email_verificado:
            user.email_verificado = True
            user.save(update_fields=["email_verificado"])

        return Response({"detail": "Correo verificado correctamente."})


class ReenviarVerificacionView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        respuesta = {
            "detail": "Si la cuenta existe y está pendiente, recibirás un nuevo correo."
        }

        if not email:
            return Response(respuesta)

        user = Usuario.objects.filter(email__iexact=email).first()
        if user and user.is_active and not user.email_verificado:
            enviar_verificacion(user)

        return Response(respuesta)
