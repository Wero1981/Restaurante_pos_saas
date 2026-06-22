from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from restaurantes.models import Restaurante
from usuarios.models import Usuario

from .limites import obtener_limites_efectivos, obtener_suscripcion
from .models import Plan, Suscripcion


class LimitesSuscripcionTests(TestCase):
    def setUp(self):
        self.principal = Usuario.objects.create_user(
            email="principal-limites@example.com",
            nombre="Principal",
            password="test-password",
        )
        self.matriz = Restaurante.objects.create(
            nombre="Matriz",
            propietario=self.principal,
            direccion="",
            telefono="",
            es_matriz=True,
        )
        self.sucursal = Restaurante.objects.create(
            nombre="Sucursal",
            propietario=self.principal,
            direccion="",
            telefono="",
            es_matriz=False,
        )
        self.plan = Plan.objects.create(
            nombre="Profesional límites",
            precio="599.00",
            limite_usuarios=15,
            limite_sucursales=3,
            limite_cajas=3,
        )
        self.suscripcion = Suscripcion.objects.create(
            usuario_principal=self.principal,
            plan=self.plan,
            vence=timezone.localdate() + timedelta(days=15),
            estado_pago=Suscripcion.ESTADO_TRIAL,
        )

    def test_prueba_aplica_limites_reducidos(self):
        limites = obtener_limites_efectivos(self.suscripcion)
        self.assertEqual(
            limites,
            {"restaurantes": 1, "usuarios": 4, "cajas": 1},
        )

    def test_pago_autorizado_aplica_limites_del_plan(self):
        self.suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        self.suscripcion.save(update_fields=["estado_pago"])

        limites = obtener_limites_efectivos(self.suscripcion)

        self.assertEqual(
            limites,
            {"restaurantes": 3, "usuarios": 15, "cajas": 3},
        )

    def test_sucursal_usa_suscripcion_del_principal(self):
        encontrada = obtener_suscripcion(self.sucursal)
        self.assertEqual(encontrada, self.suscripcion)

    def test_suscripcion_vencida_no_devuelve_limites(self):
        self.suscripcion.vence = timezone.localdate() - timedelta(days=1)
        self.suscripcion.save(update_fields=["vence"])

        with self.assertRaises(ValidationError):
            obtener_limites_efectivos(self.suscripcion)
