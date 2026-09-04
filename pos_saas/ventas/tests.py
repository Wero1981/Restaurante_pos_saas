from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from productos.models import Categoria, Producto
from restaurantes.models import AreaServicio, Estacion, Permiso, Restaurante, UsuarioRestaurante
from usuarios.models import Usuario
from caja.models import Caja
from suscripciones.models import Plan, Suscripcion

from .models import Mesa, Pedido, PedidoDetalle, Venta


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
        plan = Plan.objects.create(
            nombre="Plan mesas",
            precio="299.00",
            limite_usuarios=5,
            limite_sucursales=3,
            limite_cajas=3,
        )
        Suscripcion.objects.create(
            usuario_principal=self.admin,
            plan=plan,
            vence=timezone.localdate() + timedelta(days=15),
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

    def test_crea_mesa_en_area_seleccionada(self):
        terraza = AreaServicio.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Terraza",
        )

        response = self.client.post(
            "/api/mesas/",
            {"numero": "T-1", "capacidad": 4, "area": terraza.id},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["area"], terraza.id)
        self.assertEqual(response.data["area_nombre"], "Terraza")

    def test_mesa_sin_area_crea_y_usa_area_general(self):
        response = self.client.post(
            "/api/mesas/",
            {"numero": "5", "capacidad": 2},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["area_nombre"], "General")

    def test_rechaza_area_de_otro_restaurante(self):
        area_ajena = AreaServicio.objects.create(
            restaurante=self.restaurante_ajeno,
            nombre="Privada",
        )

        response = self.client.post(
            "/api/mesas/",
            {"numero": "6", "capacidad": 4, "area": area_ajena.id},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("area", response.data)

    def test_lista_areas_solo_del_restaurante_activo(self):
        AreaServicio.objects.create(
            restaurante=self.restaurante_uno,
            nombre="Salón",
        )
        terraza = AreaServicio.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Terraza",
        )

        response = self.client.get(
            "/api/restaurantes/areas/",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([area["id"] for area in response.data], [terraza.id])

    def test_mesero_puede_consultar_pero_no_crear_mesas(self):
        mesero = Usuario.objects.create_user(
            email="mesero-mesas@example.com",
            nombre="Mesero",
            password="test-password",
        )
        UsuarioRestaurante.objects.create(
            usuario=mesero,
            restaurante=self.restaurante_dos,
            rol=UsuarioRestaurante.MESERO,
        )
        self.client.force_authenticate(mesero)

        listado = self.client.get(
            "/api/mesas/",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )
        creacion = self.client.post(
            "/api/mesas/",
            {"numero": "7", "capacidad": 4},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(listado.status_code, status.HTTP_200_OK)
        self.assertEqual(creacion.status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_con_permiso_puede_administrar_mesas_y_areas(self):
        gerente = Usuario.objects.create_user(
            email="gerente-mesas@example.com",
            nombre="Gerente",
            password="test-password",
        )
        relacion = UsuarioRestaurante.objects.create(
            usuario=gerente,
            restaurante=self.restaurante_dos,
            rol=UsuarioRestaurante.GERENTE,
        )
        permiso, _ = Permiso.objects.get_or_create(
            codigo="administrar_mesas",
            defaults={"descripcion": "Administrar mesas y áreas"},
        )
        relacion.permisos.add(permiso)
        self.client.force_authenticate(gerente)

        area = self.client.post(
            "/api/restaurantes/areas/",
            {"nombre": "Patio", "orden": 2},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )
        mesa = self.client.post(
            "/api/mesas/",
            {"numero": "P-1", "capacidad": 4, "area": area.data["id"]},
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(area.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mesa.status_code, status.HTTP_201_CREATED)

    def test_desactivar_area_puede_mover_sus_mesas_a_general(self):
        terraza = AreaServicio.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Terraza",
        )
        self.mesa_dos.area = terraza
        self.mesa_dos.save(update_fields=["area"])

        response = self.client.put(
            f"/api/restaurantes/areas/{terraza.id}/",
            {
                "nombre": "Terraza",
                "activa": False,
                "orden": 0,
                "accion_mesas": "mover_general",
            },
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mesa_dos.refresh_from_db()
        self.assertEqual(self.mesa_dos.area.nombre, "General")

    def test_desactivar_area_puede_ocultar_sus_mesas(self):
        terraza = AreaServicio.objects.create(
            restaurante=self.restaurante_dos,
            nombre="Terraza",
        )
        self.mesa_dos.area = terraza
        self.mesa_dos.save(update_fields=["area"])

        desactivar = self.client.put(
            f"/api/restaurantes/areas/{terraza.id}/",
            {
                "nombre": "Terraza",
                "activa": False,
                "orden": 0,
                "accion_mesas": "ocultar",
            },
            format="json",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )
        mesas = self.client.get(
            "/api/mesas/",
            HTTP_X_RESTAURANTE_ID=str(self.restaurante_dos.id),
        )

        self.assertEqual(desactivar.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.mesa_dos.id, [mesa["id"] for mesa in mesas.data])

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


class OrdenesCocinaPorEstacionTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email='admin-estaciones@example.com',
            nombre='Admin',
            password='test-password',
        )
        self.cocinero = Usuario.objects.create_user(
            email='cocinero-estaciones@example.com',
            nombre='Cocinero',
            password='test-password',
        )
        self.restaurante = Restaurante.objects.create(
            nombre='Restaurante Estaciones',
            direccion='Dirección',
            telefono='111',
            propietario=self.admin,
        )
        self.cocina = Estacion.objects.create(restaurante=self.restaurante, nombre='Cocina')
        self.barra = Estacion.objects.create(restaurante=self.restaurante, nombre='Barra')
        relacion = UsuarioRestaurante.objects.create(
            usuario=self.cocinero,
            restaurante=self.restaurante,
            rol=UsuarioRestaurante.COCINERO,
        )
        relacion.estaciones.add(self.cocina)
        categoria = Categoria.objects.create(restaurante=self.restaurante, nombre='Menú')
        productos = [
            Producto.objects.create(restaurante=self.restaurante, categoria=categoria, estacion=self.cocina, nombre='Tacos', precio='10.00', stock=-1),
            Producto.objects.create(restaurante=self.restaurante, categoria=categoria, estacion=self.barra, nombre='Limonada', precio='10.00', stock=-1),
            Producto.objects.create(restaurante=self.restaurante, categoria=categoria, nombre='Sin estación', precio='10.00', stock=-1),
        ]
        mesa = Mesa.objects.create(restaurante=self.restaurante, nombre='1', estado='ocupada')
        pedido = Pedido.objects.create(restaurante=self.restaurante, mesa=mesa, estado='abierto')
        for producto in productos:
            PedidoDetalle.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=1,
                precio_unitario=producto.precio,
                subtotal=producto.precio,
                enviado_cocina=True,
            )
        self.headers = {'HTTP_X_RESTAURANTE_ID': str(self.restaurante.id)}

    def test_cocinero_ve_solo_su_estacion_y_productos_sin_asignar(self):
        self.client.force_authenticate(self.cocinero)

        response = self.client.get('/api/pedidos/cocina/', **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [detalle['producto']['nombre'] for detalle in response.data[0]['detalles']]
        self.assertEqual(nombres, ['Tacos', 'Sin estación'])

    def test_admin_ve_productos_de_todas_las_estaciones(self):
        self.client.force_authenticate(self.admin)

        response = self.client.get('/api/pedidos/cocina/', **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [detalle['producto']['nombre'] for detalle in response.data[0]['detalles']]
        self.assertEqual(nombres, ['Tacos', 'Limonada', 'Sin estación'])


class VentaPorCajaSeleccionadaTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            email="admin-venta-caja@example.com",
            nombre="Admin",
            password="test-password",
        )
        self.restaurante = Restaurante.objects.create(
            nombre="Restaurante Venta",
            direccion="Dirección",
            telefono="111",
            propietario=self.admin,
        )
        self.otro_restaurante = Restaurante.objects.create(
            nombre="Otro Restaurante",
            direccion="Dirección",
            telefono="222",
            propietario=self.admin,
        )
        categoria = Categoria.objects.create(
            restaurante=self.restaurante,
            nombre="Categoría",
        )
        self.producto = Producto.objects.create(
            restaurante=self.restaurante,
            categoria=categoria,
            nombre="Producto",
            precio=Decimal("20.00"),
            stock=Decimal("10.000"),
        )
        self.caja = Caja.objects.create(
            restaurante=self.restaurante,
            usuario=self.admin,
            monto_inicial=Decimal("100.00"),
        )
        self.caja_ajena = Caja.objects.create(
            restaurante=self.otro_restaurante,
            usuario=self.admin,
            monto_inicial=Decimal("100.00"),
        )
        self.client.force_authenticate(self.admin)
        self.headers = {"HTTP_X_RESTAURANTE_ID": str(self.restaurante.id)}

    def payload(self, caja):
        return {
            "total": "20.00",
            "metodo_pago": "efectivo",
            "caja": caja.id,
            "detalles": [{
                "producto": self.producto.id,
                "cantidad": "1.000",
                "precio_unitario": "20.00",
            }],
        }

    def test_venta_se_guarda_en_caja_seleccionada(self):
        response = self.client.post(
            "/api/ventas/",
            self.payload(self.caja),
            format="json",
            **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Venta.objects.get(id=response.data["id"]).caja, self.caja)

    def test_rechaza_caja_de_otro_restaurante(self):
        response = self.client.post(
            "/api/ventas/",
            self.payload(self.caja_ajena),
            format="json",
            **self.headers,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
