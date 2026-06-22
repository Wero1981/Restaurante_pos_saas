from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from usuarios.models import Usuario
from suscripciones.models import Plan, Suscripcion

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


class LimitesPlanRestauranteTests(APITestCase):
    def setUp(self):
        self.principal = Usuario.objects.create_user(
            email="principal-limites-restaurante@example.com",
            nombre="Principal",
            password="test-password",
        )
        self.matriz = Restaurante.objects.create(
            nombre="Matriz Límites",
            direccion="Dirección",
            telefono="1111111111",
            propietario=self.principal,
            es_matriz=True,
        )
        UsuarioRestaurante.objects.create(
            usuario=self.principal,
            restaurante=self.matriz,
            rol=UsuarioRestaurante.ADMIN,
        )
        self.plan = Plan.objects.create(
            nombre="Plan límites restaurante",
            precio="599.00",
            limite_usuarios=6,
            limite_sucursales=3,
            limite_cajas=3,
        )
        self.suscripcion = Suscripcion.objects.create(
            usuario_principal=self.principal,
            plan=self.plan,
            vence=timezone.localdate() + timedelta(days=15),
        )
        self.client.force_authenticate(self.principal)
        self.headers = {"HTTP_X_RESTAURANTE_ID": str(self.matriz.id)}

    def test_prueba_no_permite_crear_sucursal(self):
        response = self.client.post(
            "/api/restaurantes/",
            {"nombre": "Sucursal", "direccion": "Dirección", "telefono": "222"},
            format="json",
            **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_plan_autorizado_permite_crear_sucursal(self):
        self.suscripcion.estado_pago = Suscripcion.ESTADO_AUTORIZADA
        self.suscripcion.save(update_fields=["estado_pago"])

        response = self.client.post(
            "/api/restaurantes/",
            {"nombre": "Sucursal", "direccion": "Dirección", "telefono": "222"},
            format="json",
            **self.headers,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Restaurante.objects.get(id=response.data["id"]).es_matriz)

    def test_prueba_limita_a_cuatro_empleados(self):
        for numero in range(4):
            empleado = Usuario.objects.create_user(
                email=f"empleado-{numero}@example.com",
                nombre=f"Empleado {numero}",
                password="test-password",
            )
            UsuarioRestaurante.objects.create(
                usuario=empleado,
                restaurante=self.matriz,
                rol=UsuarioRestaurante.MESERO,
            )

        response = self.client.post(
            "/api/restaurantes/usuarios/",
            {
                "email": "quinto",
                "nombre": "Quinto",
                "password": "test-password",
                "rol": UsuarioRestaurante.MESERO,
            },
            format="json",
            **self.headers,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
