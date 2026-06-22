from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from restaurantes.models import Restaurante
from usuarios.models import Usuario
from suscripciones.models import Plan, Suscripcion

from .models import Caja, MovimientoCaja


class CajaPorRestauranteTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-caja@example.com",
            nombre="Admin",
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
        self.caja_uno = Caja.objects.create(
            restaurante=self.restaurante_uno,
            usuario=self.admin,
            monto_inicial=Decimal("100.00"),
        )
        self.caja_dos = Caja.objects.create(
            restaurante=self.restaurante_dos,
            usuario=self.admin,
            monto_inicial=Decimal("200.00"),
        )
        self.plan = Plan.objects.create(
            nombre="Plan cajas test",
            precio="299.00",
            limite_usuarios=5,
            limite_sucursales=2,
            limite_cajas=3,
        )
        self.suscripcion = Suscripcion.objects.create(
            usuario_principal=self.admin,
            plan=self.plan,
            vence=timezone.localdate() + timedelta(days=15),
        )
        self.client.force_authenticate(self.admin)

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def test_lista_solo_caja_del_restaurante_activo(self):
        response = self.client.get(
            "/api/caja/cajas/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([caja["id"] for caja in response.data], [self.caja_dos.id])

    def test_abre_caja_en_restaurante_activo(self):
        self.caja_dos.abierta = False
        self.caja_dos.save(update_fields=["abierta"])

        response = self.client.post(
            "/api/caja/cajas/",
            {
                "restaurante": self.restaurante_uno.id,
                "usuario": self.admin.id,
                "monto_inicial": "50.00",
                "abierta": True,
            },
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        caja = Caja.objects.get(id=response.data["id"])
        self.assertEqual(caja.restaurante, self.restaurante_dos)
        self.assertEqual(caja.usuario, self.admin)

    def test_no_permite_dos_cajas_abiertas_en_el_mismo_restaurante(self):
        response = self.client.post(
            "/api/caja/cajas/",
            {"monto_inicial": "50.00", "abierta": True},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_plan_autorizado_permite_varias_cajas_hasta_limite(self):
        self.suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        self.suscripcion.save(update_fields=["estado_pago"])

        response = self.client.post(
            "/api/caja/cajas/",
            {"monto_inicial": "50.00"},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Caja.objects.filter(restaurante=self.restaurante_dos, abierta=True).count(),
            2,
        )

    def test_no_permite_cerrar_caja_de_otro_restaurante(self):
        response = self.client.post(
            f"/api/caja/cajas/{self.caja_uno.id}/cerrar/",
            {},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.caja_uno.refresh_from_db()
        self.assertTrue(self.caja_uno.abierta)

    def test_no_permite_movimiento_en_caja_de_otro_restaurante(self):
        response = self.client.post(
            "/api/caja/movimientos/",
            {
                "caja": self.caja_uno.id,
                "tipo": "entrada",
                "monto": "25.00",
                "descripcion": "Movimiento invalido",
            },
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            MovimientoCaja.objects.filter(
                caja=self.caja_uno,
                monto=Decimal("25.00"),
            ).exists()
        )
