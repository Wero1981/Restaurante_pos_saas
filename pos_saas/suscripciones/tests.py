from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from restaurantes.models import Restaurante, UsuarioRestaurante
from usuarios.models import Usuario

from .models import Plan, Suscripcion


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
            limi_cajas=1,
        )
        self.profesional = Plan.objects.create(
            nombre="Profesional Test",
            precio="599.00",
            limite_usuarios=15,
            limite_sucursales=3,
            limi_cajas=3,
        )
        self.suscripcion_uno = Suscripcion.objects.create(
            restaurante=self.restaurante_uno,
            plan=self.basico,
            vence=timezone.localdate() + timedelta(days=15),
        )

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def test_suscripcion_nueva_muestra_quince_dias(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(
            "/api/suscripciones/actual/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["dias_restantes"], 15)
        self.assertTrue(response.data["en_periodo_prueba"])

    def test_suscripcion_se_filtra_por_restaurante_activo(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(
            "/api/suscripciones/actual/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["restaurante"], self.restaurante_dos.nombre)
        self.assertNotEqual(response.data["id"], self.suscripcion_uno.id)

    def test_admin_puede_seleccionar_plan_sin_extender_prueba(self):
        self.client.force_authenticate(self.admin)
        vencimiento_original = self.suscripcion_uno.vence

        response = self.client.post(
            "/api/suscripciones/seleccionar-plan/",
            {"plan_id": self.profesional.id},
            format="json",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.suscripcion_uno.refresh_from_db()
        self.assertEqual(self.suscripcion_uno.plan, self.profesional)
        self.assertEqual(self.suscripcion_uno.vence, vencimiento_original)

    def test_gerente_no_puede_consultar_planes(self):
        self.client.force_authenticate(self.gerente)

        response = self.client.get(
            "/api/suscripciones/planes/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
