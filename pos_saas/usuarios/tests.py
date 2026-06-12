from rest_framework import status
from rest_framework.test import APITestCase

from restaurantes.models import UsuarioRestaurante
from suscripciones.models import Plan


class RegistroUsuarioTests(APITestCase):
    def setUp(self):
        Plan.objects.create(
            nombre="Basico",
            precio="0.00",
            limite_usuarios=5,
            limite_sucursales=1,
            limi_cajas=1,
        )

    def test_registro_devuelve_sesion_completa_de_administrador(self):
        response = self.client.post(
            "/api/usuarios/registro/",
            {
                "email": "nuevo-admin@example.com",
                "password": "test-password",
                "nombre": "Nuevo Admin",
                "restaurante_nombre": "Restaurante Nuevo",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["rol"], UsuarioRestaurante.ADMIN)
        self.assertEqual(
            response.data["user"]["restaurante_nombre"],
            "Restaurante Nuevo",
        )
        self.assertTrue(response.data["user"]["restaurante_id"])
        self.assertTrue(response.data["user"]["restaurante_slug"])
