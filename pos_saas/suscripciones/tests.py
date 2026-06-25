from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from restaurantes.models import Restaurante, UsuarioRestaurante
from usuarios.models import Usuario

from .models import Pago, Plan, Suscripcion


class SuscripcionesTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-suscripciones@example.com",
            nombre="Admin",
            password="test-password",
        )
        self.gerente = Usuario.objects.create_user(
            email="gerente-suscripciones@example.com",
            nombre="Gerente",
            password="test-password",
        )
        self.restaurante_uno = Restaurante.objects.create(
            nombre="Restaurante Uno",
            direccion="Direccion 1",
            telefono="1111111111",
            propietario=self.admin,
            es_matriz=True,
        )
        self.restaurante_dos = Restaurante.objects.create(
            nombre="Restaurante Dos",
            direccion="Direccion 2",
            telefono="2222222222",
            propietario=self.admin,
        )
        UsuarioRestaurante.objects.create(
            usuario=self.gerente,
            restaurante=self.restaurante_uno,
            rol=UsuarioRestaurante.GERENTE,
        )
        self.basico = Plan.objects.create(
            nombre="Basico Test",
            precio="299.00",
            limite_usuarios=5,
            limite_sucursales=1,
            limite_cajas=1,
        )
        self.profesional = Plan.objects.create(
            nombre="Profesional Test",
            precio="599.00",
            limite_usuarios=15,
            limite_sucursales=3,
            limite_cajas=3,
        )
        self.suscripcion_uno = Suscripcion.objects.create(
            usuario_principal=self.admin,
            plan=self.basico,
            vence=timezone.localdate() + timedelta(days=15),
        )

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def jwt_headers(self, usuario, restaurante):
        token = RefreshToken.for_user(usuario).access_token
        return {
            "HTTP_AUTHORIZATION": f"Bearer {token}",
            **self.headers(restaurante),
        }

    def test_suscripcion_nueva_muestra_quince_dias(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(
            "/api/suscripciones/actual/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["dias_restantes"], 15)
        self.assertTrue(response.data["en_periodo_prueba"])

    def test_sucursal_comparte_suscripcion_del_principal(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(
            "/api/suscripciones/actual/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.suscripcion_uno.id)

    def test_middleware_bloquea_modulos_con_suscripcion_vencida_y_jwt(self):
        self.suscripcion_uno.vence = timezone.localdate() - timedelta(days=1)
        self.suscripcion_uno.save(update_fields=["vence"])

        response = self.client.get(
            "/api/productos/",
            **self.jwt_headers(self.admin, self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()["detail"], "La suscripción está vencida o inactiva.")
        self.assertEqual(response.json()["codigo"], "SUSCRIPCION_VENCIDA")

    def test_middleware_permite_suscripciones_con_suscripcion_vencida_y_jwt(self):
        self.suscripcion_uno.vence = timezone.localdate() - timedelta(days=1)
        self.suscripcion_uno.save(update_fields=["vence"])

        response = self.client.get(
            "/api/suscripciones/actual/",
            **self.jwt_headers(self.admin, self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["esta_vencida"])

    def test_plan_pago_requiere_checkout(self):
        self.client.force_authenticate(self.admin)
        vencimiento_original = self.suscripcion_uno.vence

        response = self.client.post(
            "/api/suscripciones/seleccionar-plan/",
            {"plan_id": self.profesional.id},
            format="json",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.suscripcion_uno.refresh_from_db()
        self.assertEqual(self.suscripcion_uno.plan, self.basico)
        self.assertEqual(self.suscripcion_uno.vence, vencimiento_original)

    def test_gerente_no_puede_consultar_planes(self):
        self.client.force_authenticate(self.gerente)

        response = self.client.get(
            "/api/suscripciones/planes/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("suscripciones.views.crear_checkout_plan")
    def test_admin_puede_crear_checkout_mercadopago(self, crear_checkout_plan):
        crear_checkout_plan.return_value = {
            "id": "plan-remoto-123",
            "status": "active",
            "init_point": "https://www.mercadopago.com.mx/subscriptions/checkout",
        }
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/suscripciones/mercadopago/crear/",
            {"plan_id": self.profesional.id},
            format="json",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["checkout_url"],
            "https://www.mercadopago.com.mx/subscriptions/checkout",
        )
        self.suscripcion_uno.refresh_from_db()
        self.assertEqual(self.suscripcion_uno.plan, self.basico)
        self.assertEqual(self.suscripcion_uno.plan_pendiente, self.profesional)
        self.assertEqual(self.suscripcion_uno.proveedor, Suscripcion.PROVEEDOR_MERCADOPAGO)
        self.assertEqual(self.suscripcion_uno.proveedor_suscripcion_id, "plan-remoto-123")
        self.assertEqual(self.suscripcion_uno.estado_pago, Suscripcion.ESTADO_PENDIENTE)

    def test_plan_gratuito_no_crea_checkout(self):
        gratis = Plan.objects.create(
            nombre="Gratis",
            precio="0.00",
            limite_usuarios=2,
            limite_sucursales=1,
            limite_cajas=1,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/suscripciones/mercadopago/crear/",
            {"plan_id": gratis.id},
            format="json",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("checkout_url", response.data)
        self.suscripcion_uno.refresh_from_db()
        self.assertEqual(self.suscripcion_uno.plan, gratis)

    @patch("suscripciones.views.verificar_firma_webhook", return_value=True)
    @patch("suscripciones.views.obtener_pago")
    def test_webhook_pago_aprobado_registra_pago_y_renueva(
        self,
        obtener_pago,
        verificar_firma_webhook,
    ):
        self.suscripcion_uno.proveedor = Suscripcion.PROVEEDOR_MERCADOPAGO
        self.suscripcion_uno.proveedor_suscripcion_id = "preapproval-123"
        self.suscripcion_uno.estado_pago = Suscripcion.ESTADO_PENDIENTE
        self.suscripcion_uno.plan_pendiente = self.profesional
        self.suscripcion_uno.save()
        obtener_pago.return_value = {
            "id": 987,
            "status": "approved",
            "transaction_amount": 599,
            "currency_id": "MXN",
            "date_approved": "2026-06-16T10:00:00-06:00",
            "preapproval_id": "preapproval-123",
        }

        response = self.client.post(
            "/api/suscripciones/mercadopago/webhook/",
            {"type": "payment", "data": {"id": "987"}},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.suscripcion_uno.refresh_from_db()
        self.assertTrue(self.suscripcion_uno.activa)
        self.assertEqual(self.suscripcion_uno.estado_pago, Suscripcion.ESTADO_AUTORIZADA)
        self.assertEqual(self.suscripcion_uno.plan, self.profesional)
        self.assertIsNone(self.suscripcion_uno.plan_pendiente)
        self.assertEqual(Pago.objects.count(), 1)

        self.client.post(
            "/api/suscripciones/mercadopago/webhook/",
            {"type": "payment", "data": {"id": "987"}},
            format="json",
        )
        self.assertEqual(Pago.objects.count(), 1)
        self.assertTrue(verificar_firma_webhook.called)

    @patch("suscripciones.views.verificar_firma_webhook", return_value=True)
    @patch("suscripciones.views.obtener_preaprobacion")
    def test_webhook_preaprobacion_cancelada_desactiva(
        self,
        obtener_preaprobacion,
        verificar_firma_webhook,
    ):
        self.suscripcion_uno.proveedor = Suscripcion.PROVEEDOR_MERCADOPAGO
        self.suscripcion_uno.proveedor_suscripcion_id = "preapproval-123"
        self.suscripcion_uno.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        self.suscripcion_uno.save()
        obtener_preaprobacion.return_value = {
            "id": "preapproval-123",
            "status": "cancelled",
        }

        response = self.client.post(
            "/api/suscripciones/mercadopago/webhook/",
            {"type": "subscription_preapproval", "data": {"id": "preapproval-123"}},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.suscripcion_uno.refresh_from_db()
        self.assertFalse(self.suscripcion_uno.activa)
        self.assertEqual(self.suscripcion_uno.estado_pago, Suscripcion.ESTADO_CANCELADA)
        verificar_firma_webhook.assert_called_once()
