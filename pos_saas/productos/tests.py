from rest_framework import status
from rest_framework.test import APITestCase

from restaurantes.models import Restaurante
from usuarios.models import Usuario

from .models import Categoria, Producto


class InventarioPorRestauranteTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-inventario@example.com",
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
        self.categoria_uno = Categoria.objects.create(
            restaurante=self.restaurante_uno,
            nombre="Categoria Uno",
        )
        self.categoria_dos = Categoria.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Categoria Dos",
        )
        self.producto_uno = Producto.objects.create(
            restaurante=self.restaurante_uno,
            categoria=self.categoria_uno,
            nombre="Producto Uno",
            precio="10.00",
            stock="5.000",
        )
        self.producto_dos = Producto.objects.create(
            restaurante=self.restaurante_dos,
            categoria=self.categoria_dos,
            nombre="Producto Dos",
            precio="20.00",
            stock="8.000",
        )
        self.client.force_authenticate(self.admin)

    def headers(self, restaurante):
        return {"HTTP_X_RESTAURANTE_ID": str(restaurante.id)}

    def test_lista_productos_del_restaurante_activo(self):
        response = self.client.get(
            "/api/productos/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [producto["id"] for producto in response.data],
            [self.producto_dos.id],
        )

    def test_lista_categorias_del_restaurante_activo(self):
        response = self.client.get(
            "/api/productos/categorias/",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [categoria["id"] for categoria in response.data],
            [self.categoria_dos.id],
        )

    def test_crea_producto_en_restaurante_activo(self):
        response = self.client.post(
            "/api/productos/",
            {
                "nombre": "Producto Nuevo",
                "descripcion": "",
                "precio": "15.00",
                "precio_por_unidad": "unidad",
                "stock": "3.000",
                "activo": True,
                "categoria": self.categoria_dos.id,
            },
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Producto.objects.filter(
                id=response.data["id"],
                restaurante=self.restaurante_dos,
            ).exists()
        )

    def test_rechaza_categoria_de_otro_restaurante(self):
        response = self.client.post(
            "/api/productos/",
            {
                "nombre": "Producto Invalido",
                "descripcion": "",
                "precio": "15.00",
                "precio_por_unidad": "unidad",
                "stock": "3.000",
                "activo": True,
                "categoria": self.categoria_uno.id,
            },
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("categoria", response.data)

    def test_no_permite_editar_producto_de_otro_restaurante(self):
        response = self.client.patch(
            f"/api/productos/{self.producto_uno.id}/",
            {"stock": "99.000"},
            format="json",
            **self.headers(self.restaurante_dos),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.producto_uno.refresh_from_db()
        self.assertEqual(str(self.producto_uno.stock), "5.000")
