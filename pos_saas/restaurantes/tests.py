from rest_framework import status
from rest_framework.test import APITestCase

from usuarios.models import Usuario

from .models import Permiso, Restaurante, UsuarioRestaurante


class GestionUsuariosSoloAdminTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-usuarios@example.com",
            nombre="Admin",
            password="test-password",
        )
        self.gerente = Usuario.objects.create_user(
            email="gerente-usuarios@example.com",
            nombre="Gerente",
            password="test-password",
        )
        self.empleado_uno = Usuario.objects.create_user(
            email="empleado-uno@example.com",
            nombre="Empleado Uno",
            password="test-password",
        )
        self.empleado_dos = Usuario.objects.create_user(
            email="empleado-dos@example.com",
            nombre="Empleado Dos",
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
        self.relacion_gerente = UsuarioRestaurante.objects.create(
            usuario=self.gerente,
            restaurante=self.restaurante_uno,
            rol=UsuarioRestaurante.GERENTE,
        )
        permiso, _ = Permiso.objects.get_or_create(
            codigo="administrar_usuarios",
            defaults={"descripcion": "Administrar usuarios"},
        )
        self.relacion_gerente.permisos.add(permiso)
        self.relacion_uno = UsuarioRestaurante.objects.create(
            usuario=self.empleado_uno,
            restaurante=self.restaurante_uno,
            rol=UsuarioRestaurante.MESERO,
        )
        self.relacion_dos = UsuarioRestaurante.objects.create(
            usuario=self.empleado_dos,
            restaurante=self.restaurante_dos,
            rol=UsuarioRestaurante.CAJERO,
        )

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def test_admin_lista_solo_usuarios_del_restaurante_activo(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get(
            "/api/restaurantes/usuarios/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [relacion["id"] for relacion in response.data],
            [self.relacion_dos.id],
        )

    def test_empleado_con_permiso_no_puede_ver_usuarios(self):
        self.client.force_authenticate(self.gerente)

        response = self.client.get(
            "/api/restaurantes/usuarios/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empleado_con_permiso_no_puede_ver_permisos(self):
        self.client.force_authenticate(self.gerente)

        response = self.client.get(
            "/api/restaurantes/permisos/",
            **self.headers(self.restaurante_uno),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_no_puede_editar_usuario_de_otro_restaurante(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/restaurantes/usuarios/{self.relacion_uno.id}/",
            {"rol": UsuarioRestaurante.CAJERO},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.relacion_uno.refresh_from_db()
        self.assertEqual(self.relacion_uno.rol, UsuarioRestaurante.MESERO)
