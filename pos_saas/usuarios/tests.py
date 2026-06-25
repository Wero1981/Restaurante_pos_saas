from django.core import mail
from django.core.signing import SignatureExpired
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from restaurantes.models import UsuarioRestaurante
from suscripciones.models import Plan
from usuarios.email_verification import generar_token
from usuarios.models import Usuario


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://localhost:5173",
)
class RegistroUsuarioTests(APITestCase):
    def setUp(self):
        Plan.objects.create(
            nombre="Basico",
            precio="0.00",
            limite_usuarios=5,
            limite_sucursales=1,
            limite_cajas=1,
        )
        self.payload = {
            "email": "nuevo-admin@example.com",
            "password": "Test-password1",
            "nombre": "Nuevo Admin",
            "restaurante_nombre": "Restaurante Nuevo",
        }

    def registrar_usuario(self):
        return self.client.post(
            "/api/usuarios/registro/",
            self.payload,
            format="json",
        )

    def test_registro_crea_cuenta_pendiente_y_envia_correo(self):
        response = self.registrar_usuario()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("access", response.data)
        self.assertEqual(response.data["email"], self.payload["email"])

        user = Usuario.objects.get(email=self.payload["email"])
        self.assertFalse(user.email_verificado)
        self.assertTrue(
            UsuarioRestaurante.objects.filter(
                usuario=user,
                rol=UsuarioRestaurante.ADMIN,
            ).exists()
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/verificar-correo?token=", mail.outbox[0].body)

    def test_login_bloquea_usuario_no_verificado(self):
        self.registrar_usuario()

        response = self.client.post(
            "/api/usuarios/login/",
            {
                "email": self.payload["email"],
                "password": self.payload["password"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "email_not_verified")

    def test_verificar_correo_habilita_login(self):
        self.registrar_usuario()
        user = Usuario.objects.get(email=self.payload["email"])

        verify_response = self.client.post(
            "/api/usuarios/verificar-correo/",
            {"token": generar_token(user)},
            format="json",
        )
        login_response = self.client.post(
            "/api/usuarios/login/",
            {
                "email": self.payload["email"],
                "password": self.payload["password"],
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.email_verificado)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)

    @patch("usuarios.views.validar_token", side_effect=SignatureExpired)
    def test_verificar_correo_informa_token_vencido(self, validar_token):
        response = self.client.post(
            "/api/usuarios/verificar-correo/",
            {"token": "expired-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "token_expired")
        validar_token.assert_called_once_with("expired-token")

    def test_reenviar_verificacion_envia_nuevo_correo(self):
        self.registrar_usuario()
        mail.outbox.clear()

        response = self.client.post(
            "/api/usuarios/reenviar-verificacion/",
            {"email": self.payload["email"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)


class GoogleLoginTests(APITestCase):
    def setUp(self):
        Plan.objects.create(
            nombre="Basico",
            precio="0.00",
            limite_usuarios=5,
            limite_sucursales=1,
            limite_cajas=1,
        )
        self.google_data = {
            "sub": "google-user-123",
            "email": "google@example.com",
            "email_verified": True,
            "given_name": "Google",
        }

    @patch("usuarios.views.id_token.verify_oauth2_token")
    def test_login_google_requiere_registro_para_usuario_nuevo(self, verify_token):
        verify_token.return_value = self.google_data

        response = self.client.post(
            "/api/usuarios/login-google/",
            {"credential": "google-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(Usuario.objects.filter(email="google@example.com").exists())

    @patch("usuarios.views.id_token.verify_oauth2_token")
    def test_registro_google_crea_usuario_verificado_y_sesion(self, verify_token):
        verify_token.return_value = self.google_data

        response = self.client.post(
            "/api/usuarios/login-google/",
            {
                "credential": "google-token",
                "restaurante_nombre": "Restaurante Google",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["rol"], UsuarioRestaurante.ADMIN)

        user = Usuario.objects.get(email="google@example.com")
        self.assertTrue(user.email_verificado)
        self.assertEqual(user.google_id, "google-user-123")
        self.assertFalse(user.has_usable_password())

    @patch("usuarios.views.id_token.verify_oauth2_token")
    def test_google_verifica_cuenta_existente_con_mismo_correo(self, verify_token):
        verify_token.return_value = self.google_data
        user = Usuario.objects.create_user(
            email="google@example.com",
            nombre="Google",
            password="test-password",
            email_verificado=False,
        )

        response = self.client.post(
            "/api/usuarios/login-google/",
            {"credential": "google-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.email_verificado)
        self.assertEqual(user.google_id, "google-user-123")
