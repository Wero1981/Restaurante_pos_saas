from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from productos.models import Categoria, Producto
from restaurantes.models import Restaurante
from usuarios.models import Usuario

from .models import Mesa, Pedido, PedidoDetalle


class MesasPorRestauranteTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin@example.com",
            nombre="Admin",
            password="test-password",
        )
        self.otro_usuario = Usuario.objects.create_user(
            email="otro@example.com",
            nombre="Otro",
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
        self.restaurante_ajeno = Restaurante.objects.create(
            nombre="Restaurante Ajeno",
            direccion="Direccion 3",
            telefono="3333333333",
            propietario=self.otro_usuario,
        )
        self.mesa_uno = Mesa.objects.create(
            restaurante=self.restaurante_uno,
            nombre="1",
        )
        self.mesa_dos = Mesa.objects.create(
            restaurante=self.restaurante_dos,
            nombre="2",
        )
        Mesa.objects.create(
            restaurante=self.restaurante_ajeno,
            nombre="3",
        )
        self.client.force_authenticate(self.admin)

    def test_lista_solo_mesas_del_restaurante_seleccionado(self):
        response = self.client.get(
            "/api/mesas/",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([mesa["id"] for mesa in response.data], [self.mesa_dos.id])

    def test_crea_mesa_en_restaurante_seleccionado(self):
        response = self.client.post(
            "/api/mesas/",
            {"numero": "4", "capacidad": 6},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Mesa.objects.filter(
                id=response.data["id"],
                restaurante=self.restaurante_dos,
            ).exists()
        )

    def test_abre_pedido_en_restaurante_seleccionado(self):
        response = self.client.post(
            "/api/pedidos/abrir/",
            {"mesa_id": self.mesa_dos.id},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Pedido.objects.filter(
                id=response.data["id"],
                restaurante=self.restaurante_dos,
                mesa=self.mesa_dos,
            ).exists()
        )

    def test_rechaza_restaurante_ajeno(self):
        response = self.client.get(
            "/api/mesas/",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_ajeno.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class OrdenesCocinaPorRestauranteTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-ordenes@example.com",
            nombre="Admin",
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
        self.mesa_uno = Mesa.objects.create(
            restaurante=self.restaurante_uno,
            nombre="1",
            estado="ocupada",
        )
        self.mesa_dos = Mesa.objects.create(
            restaurante=self.restaurante_dos,
            nombre="2",
            estado="ocupada",
        )
        categoria_uno = Categoria.objects.create(
            restaurante=self.restaurante_uno,
            nombre="Categoria Uno",
        )
        categoria_dos = Categoria.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Categoria Dos",
        )
        producto_uno = Producto.objects.create(
            restaurante=self.restaurante_uno,
            categoria=categoria_uno,
            nombre="Producto Uno",
            precio=Decimal("10.00"),
            stock=Decimal("10.000"),
        )
        producto_dos = Producto.objects.create(
            restaurante=self.restaurante_dos,
            categoria=categoria_dos,
            nombre="Producto Dos",
            precio=Decimal("20.00"),
            stock=Decimal("10.000"),
        )
        self.pedido_uno = Pedido.objects.create(
            restaurante=self.restaurante_uno,
            mesa=self.mesa_uno,
            estado="abierto",
        )
        self.pedido_dos = Pedido.objects.create(
            restaurante=self.restaurante_dos,
            mesa=self.mesa_dos,
            estado="abierto",
        )
        self.detalle_uno = PedidoDetalle.objects.create(
            pedido=self.pedido_uno,
            producto=producto_uno,
            cantidad=1,
            precio_unitario=producto_uno.precio,
            subtotal=producto_uno.precio,
            enviado_cocina=True,
        )
        self.detalle_dos = PedidoDetalle.objects.create(
            pedido=self.pedido_dos,
            producto=producto_dos,
            cantidad=1,
            precio_unitario=producto_dos.precio,
            subtotal=producto_dos.precio,
            enviado_cocina=True,
        )
        self.client.force_authenticate(self.admin)

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def test_lista_solo_ordenes_del_restaurante_activo(self):
        response = self.client.get(
            "/api/pedidos/cocina/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([orden["id"] for orden in response.data], [self.pedido_dos.id])

    def test_no_permite_cancelar_orden_de_otro_restaurante(self):
        response = self.client.post(
            "/api/pedidos/cancelar/",
            {"pedido_id": self.pedido_uno.id},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.pedido_uno.refresh_from_db()
        self.assertEqual(self.pedido_uno.estado, "abierto")

    def test_no_permite_cancelar_detalle_de_otro_restaurante(self):
        response = self.client.post(
            f"/api/pedidos/detalle/{self.detalle_uno.id}/cancelar/",
            {},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.detalle_uno.refresh_from_db()
        self.assertFalse(self.detalle_uno.cancelado)

    def test_no_permite_asignar_mesa_de_otro_restaurante(self):
        response = self.client.patch(
            f"/api/pedidos/{self.pedido_dos.id}/",
            {"mesa": self.mesa_uno.id},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.pedido_dos.refresh_from_db()
        self.assertEqual(self.pedido_dos.mesa, self.mesa_dos)
