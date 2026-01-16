from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Venta, Mesa, Pedido, PedidoDetalle, Comensal
from .serializers import (
    VentaSerializer, 
    MesaSerializer, 
    ComensalSerializer, 
    PedidoDetalleSerializer,
    PedidoSerializer
)
from restaurantes.models import UsuarioRestaurante
from productos.models import Producto
from core.permissions import TienePermisoRestaurante
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes


def get_restaurante_usuario(user):
    """Obtiene el restaurante asociado al usuario autenticado."""
    if not user.is_authenticated:
        return None
    rel = UsuarioRestaurante.objects.filter(usuario=user, activo=True).first()
    return rel.restaurante if rel else None


class VentaViewSet(ModelViewSet):
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Venta.objects.none()
        return Venta.objects.filter(restaurante=restaurante)

@extend_schema_view(
    retrieve=extend_schema(
        description="Obtiene la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    ),
    update=extend_schema(
        description="Actualiza la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    ),
    destroy=extend_schema(
        description="Elimina la información de una mesa específica.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID de la mesa'
            )
        ]
    )
)
class MesaViewSet(ModelViewSet):
    serializer_class = MesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtiene las mesas del restaurante asociado al usuario autenticado."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Mesa.objects.none()
        return Mesa.objects.filter(restaurante=restaurante, activa=True)
    
    def perform_create(self, serializer):
        """Asigna el restaurante al crear una mesa."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            raise ValidationError('Usuario no está asociado a ningún restaurante')
        serializer.save(restaurante=restaurante)


class AbrirPedidoView(APIView):
    """Vista para abrir un nuevo pedido en una mesa."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'mesa_id': {
                        'type': 'integer',
                        'description': 'ID de la mesa'
                    },
                    'mesero_id': {
                        'type': 'integer',
                        'description': 'ID del mesero (opcional)',
                        'nullable': True
                    }
                },
                'required': ['mesa_id']
            }
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'mesa': {'type': 'integer'},
                    'mesero': {'type': 'integer', 'nullable': True},
                    'estado': {'type': 'string'},
                    'creado': {'type': 'string', 'format': 'date-time'}
                }
            },
            400: {'description': 'Error en la solicitud'},
            404: {'description': 'Mesa no encontrada'}
        },
        description="Abre un nuevo pedido para una mesa específica. Si la mesa ya tiene un pedido abierto, retorna ese pedido."
    )
    def post(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mesa_id = request.data.get('mesa_id')
        mesero_id = request.data.get('mesero_id')

        if not mesa_id:
            return Response(
                {'error': 'El campo mesa_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que la mesa existe y pertenece al restaurante
        try:
            mesa = Mesa.objects.get(id=mesa_id, restaurante=restaurante, activa=True)
        except Mesa.DoesNotExist:
            return Response(
                {'error': 'Mesa no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar si ya existe un pedido abierto para esta mesa
        pedido_existente = Pedido.objects.filter(
            mesa=mesa,
            estado='abierto'
        ).first()

        if pedido_existente:
            return Response({
                'id': pedido_existente.id,
                'mesa': pedido_existente.mesa.id,
                'mesero': pedido_existente.mesero.id if pedido_existente.mesero else None,
                'estado': pedido_existente.estado,
                'creado': pedido_existente.creado,
                'mensaje': 'Ya existe un pedido abierto para esta mesa'
            }, status=status.HTTP_200_OK)

        # Crear nuevo pedido
        pedido = Pedido.objects.create(
            restaurante=restaurante,
            mesa=mesa,
            mesero_id=mesero_id if mesero_id else None,
            estado='abierto'
        )

        # Actualizar estado de la mesa
        mesa.estado = 'ocupada'
        mesa.save()

        return Response({
            'id': pedido.id,
            'mesa': pedido.mesa.id,
            'mesero': pedido.mesero.id if pedido.mesero else None,
            'estado': pedido.estado,
            'creado': pedido.creado
        }, status=status.HTTP_201_CREATED)

class CancelarPedidoView(APIView):
    """Vista para cancelar un pedido existente."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'pedido_id': {
                        'type': 'integer',
                        'description': 'ID del pedido a cancelar'
                    }
                },
                'required': ['pedido_id']
            }
        },
        responses={
            200: {'description': 'Pedido cancelado exitosamente'},
            400: {'description': 'Error en la solicitud'},
            404: {'description': 'Pedido no encontrado'}
        },
        description="Cancela un pedido existente y libera la mesa asociada."
    )
    def post(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido_id = request.data.get('pedido_id')

        if not pedido_id:
            return Response(
                {'error': 'El campo pedido_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el pedido existe, pertenece al restaurante y está abierto
        try:
            pedido = Pedido.objects.get(
                id=pedido_id,
                restaurante=restaurante,
                estado='abierto'
            )
        except Pedido.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado o no está abierto'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cancelar el pedido
        pedido.estado = 'cancelado'
        pedido.save()

        # Liberar la mesa
        if pedido.mesa:
            pedido.mesa.estado = 'disponible'
            pedido.mesa.save()

            # Eliminar comensales de la mesa
            Comensal.objects.filter(mesa=pedido.mesa).delete()

        return Response(
            {'mensaje': 'Pedido cancelado exitosamente'},
            status=status.HTTP_200_OK
        )


class AgregarProductoView(APIView):
    """Vista para agregar productos a un pedido existente."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'pedido_id': {
                        'type': 'integer',
                        'description': 'ID del pedido'
                    },
                    'producto_id': {
                        'type': 'integer',
                        'description': 'ID del producto a agregar'
                    },
                    'cantidad': {
                        'type': 'integer',
                        'description': 'Cantidad del producto',
                        'default': 1
                    },
                    'comensal_id': {
                        'type': 'integer',
                        'description': 'ID del comensal (opcional)',
                        'nullable': True
                    },
                    'notas': {
                        'type': 'string',
                        'description': 'Notas especiales para el producto (opcional)',
                        'nullable': True
                    }
                },
                'required': ['pedido_id', 'producto_id']
            }
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'pedido': {'type': 'integer'},
                    'producto': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'integer'},
                            'nombre': {'type': 'string'},
                            'precio': {'type': 'number'}
                        }
                    },
                    'cantidad': {'type': 'integer'},
                    'precio_unitario': {'type': 'number'},
                    'subtotal': {'type': 'number'},
                    'comensal': {'type': 'integer', 'nullable': True},
                    'enviado_cocina': {'type': 'boolean'},
                    'fecha': {'type': 'string', 'format': 'date-time'}
                }
            },
            400: {'description': 'Error en la solicitud'},
            404: {'description': 'Pedido o producto no encontrado'}
        },
        description="Agrega un producto a un pedido existente. Calcula automáticamente el precio unitario y subtotal."
    )
    def post(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido_id = request.data.get('pedido_id')
        producto_id = request.data.get('producto_id')
        cantidad = Decimal(str(request.data.get('cantidad', 1)))
        comensal_id = request.data.get('comensal_id')
        observaciones = request.data.get('observaciones', '')

        # Validaciones
        if not pedido_id or not producto_id:
            return Response(
                {'error': 'Los campos pedido_id y producto_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cantidad <= 0:
            return Response(
                {'error': 'La cantidad debe ser mayor a 0'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el pedido existe, pertenece al restaurante y está abierto
        try:
            pedido = Pedido.objects.get(
                id=pedido_id,
                restaurante=restaurante,
                estado='abierto'
            )
        except Pedido.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado o no está abierto'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que el producto existe y pertenece al restaurante
        try:
            producto = Producto.objects.get(
                id=producto_id,
                restaurante=restaurante,
                activo=True
            )
        except Producto.DoesNotExist:
            return Response(
                {'error': 'Producto no encontrado o no está activo'},
                status=status.HTTP_404_NOT_FOUND
            )

        # NOTA: La validación y decremento de stock se realiza al crear la venta final,
        # no al agregar productos al pedido (ya que el pedido puede cancelarse)

        # Verificar comensal si se proporciona
        comensal = None
        if comensal_id:
            try:
                comensal = Comensal.objects.get(
                    id=comensal_id,
                    mesa=pedido.mesa
                )
            except Comensal.DoesNotExist:
                return Response(
                    {'error': 'Comensal no encontrado o no pertenece a la mesa del pedido'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Crear el detalle del pedido usando transacción
        try:
            with transaction.atomic():
                # Calcular precio unitario y subtotal
                precio_unitario = producto.precio
                subtotal = precio_unitario * cantidad

                # Crear el detalle
                detalle = PedidoDetalle.objects.create(
                    pedido=pedido,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                    comensal=comensal,
                    observaciones=observaciones,
                    enviado_cocina=False
                )

                # NO decrementar stock aquí - se hará al crear la venta final
                # El stock solo debe decrementarse cuando se cierra el pedido y se genera la venta

                return Response({
                    'id': detalle.id,
                    'pedido': detalle.pedido.id,
                    'producto': {
                        'id': producto.id,
                        'nombre': producto.nombre,
                        'precio': float(producto.precio)
                    },
                    'cantidad': detalle.cantidad,
                    'precio_unitario': float(detalle.precio_unitario),
                    'subtotal': float(detalle.subtotal),
                    'comensal': detalle.comensal.id if detalle.comensal else None,
                    'enviado_cocina': detalle.enviado_cocina,
                    'fecha': detalle.fecha
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Error al crear el detalle del pedido: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EnviarCocinaView(APIView):
    """Vista para enviar productos a cocina."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'pedido_id': {
                        'type': 'integer',
                        'description': 'ID del pedido'
                    },
                    'detalle_ids': {
                        'type': 'array',
                        'items': {'type': 'integer'},
                        'description': 'Lista de IDs de detalles del pedido a enviar a cocina. Si no se especifica, se envían todos los pendientes'
                    }
                },
                'required': ['pedido_id']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'mensaje': {'type': 'string'},
                    'items_enviados': {'type': 'integer'},
                    'detalles': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'integer'},
                                'producto': {'type': 'string'},
                                'cantidad': {'type': 'integer'},
                                'enviado_cocina': {'type': 'boolean'}
                            }
                        }
                    }
                }
            },
            400: {'description': 'Error en la solicitud'},
            404: {'description': 'Pedido no encontrado'}
        },
        description="Marca los productos de un pedido como enviados a cocina. Si no se especifican detalle_ids, envía todos los productos pendientes."
    )
    def post(self, request):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido_id = request.data.get('pedido_id')
        detalle_ids = request.data.get('detalle_ids', None)

        if not pedido_id:
            return Response(
                {'error': 'El campo pedido_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el pedido existe, pertenece al restaurante y está abierto
        try:
            pedido = Pedido.objects.get(
                id=pedido_id,
                restaurante=restaurante,
                estado='abierto'
            )
        except Pedido.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado o no está abierto'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener los detalles a enviar
        if detalle_ids:
            # Enviar solo los detalles especificados
            detalles = PedidoDetalle.objects.filter(
                id__in=detalle_ids,
                pedido=pedido,
                enviado_cocina=False,
                cancelado=False
            )
        else:
            # Enviar todos los detalles pendientes
            detalles = PedidoDetalle.objects.filter(
                pedido=pedido,
                enviado_cocina=False,
                cancelado=False
            )

        if not detalles.exists():
            return Response(
                {'error': 'No hay productos pendientes para enviar a cocina'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como enviados a cocina
        try:
            with transaction.atomic():
                items_actualizados = detalles.update(enviado_cocina=True)
                
                # Obtener información de los detalles enviados
                detalles_enviados = PedidoDetalle.objects.filter(
                    id__in=[d.id for d in detalles]
                ).select_related('producto')

                resultado = []
                for detalle in detalles_enviados:
                    resultado.append({
                        'id': detalle.id,
                        'producto': detalle.producto.nombre,
                        'cantidad': detalle.cantidad,
                        'enviado_cocina': detalle.enviado_cocina
                    })

                return Response({
                    'mensaje': f'{items_actualizados} producto(s) enviado(s) a cocina exitosamente',
                    'items_enviados': items_actualizados,
                    'detalles': resultado
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Error al enviar productos a cocina: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EliminarDetalleView(APIView):
    """Vista para eliminar un detalle específico del pedido."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, detalle_id):
        """Elimina un detalle específico del pedido si no ha sido enviado a cocina."""
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Buscar el detalle y verificar permisos
            detalle = PedidoDetalle.objects.select_related('pedido').get(
                id=detalle_id,
                pedido__restaurante=restaurante
            )
            
            # No permitir eliminar si ya fue enviado a cocina
            if detalle.enviado_cocina:
                return Response(
                    {'error': 'No se puede eliminar un producto que ya fue enviado a cocina'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if detalle.cancelado:
                return Response(
                    {'error': 'El producto ya fue cancelado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Eliminar el detalle
            detalle.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except PedidoDetalle.DoesNotExist:
            return Response(
                {'error': 'Detalle del pedido no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar detalle del pedido: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CancelarDetalleView(APIView):
    """Marca un detalle del pedido como cancelado."""
    permission_classes = [IsAuthenticated]

    def post(self, request, detalle_id):
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response(
                {'error': 'Usuario no está asociado a ningún restaurante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            detalle = PedidoDetalle.objects.select_related('pedido').get(
                id=detalle_id,
                pedido__restaurante=restaurante
            )

            if detalle.cancelado:
                serializer = PedidoDetalleSerializer(detalle)
                return Response(
                    {
                        'mensaje': 'El producto ya estaba cancelado',
                        'detalle': serializer.data
                    },
                    status=status.HTTP_200_OK
                )

            detalle.cancelado = True
            detalle.save(update_fields=['cancelado'])

            serializer = PedidoDetalleSerializer(detalle)
            return Response(
                {
                    'mensaje': 'Producto cancelado exitosamente',
                    'detalle': serializer.data
                },
                status=status.HTTP_200_OK
            )

        except PedidoDetalle.DoesNotExist:
            return Response(
                {'error': 'Detalle del pedido no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al cancelar detalle del pedido: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ComensalViewSet(ModelViewSet):
    """ViewSet para gestionar comensales de las mesas."""
    serializer_class = ComensalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Obtiene los comensales de las mesas del restaurante asociado al usuario autenticado."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Comensal.objects.none()
        
        queryset = Comensal.objects.filter(mesa__restaurante=restaurante)
        
        # Filtrar por mesa si se especifica
        mesa_id = self.request.query_params.get('mesa', None)
        if mesa_id:
            queryset = queryset.filter(mesa_id=mesa_id)
        
        return queryset.order_by('-creado')
    
    def perform_create(self, serializer):
        """Valida que la mesa pertenezca al restaurante antes de crear el comensal."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            raise ValidationError('Usuario no está asociado a ningún restaurante')
        
        mesa = serializer.validated_data.get('mesa')
        if mesa.restaurante != restaurante:
            raise ValidationError('La mesa no pertenece a tu restaurante')
        
        serializer.save()


class PedidoViewSet(ModelViewSet):
    """ViewSet para gestionar pedidos."""
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Obtiene los pedidos del restaurante asociado al usuario autenticado."""
        restaurante = get_restaurante_usuario(self.request.user)
        if not restaurante:
            return Pedido.objects.none()
        return Pedido.objects.filter(restaurante=restaurante).select_related('mesa', 'mesero')

    @action(detail=False, methods=['get'], url_path='cocina')
    def cocina(self, request):
        """Lista pedidos abiertos con productos enviados a cocina."""
        restaurante = get_restaurante_usuario(request.user)
        if not restaurante:
            return Response([])

        pedidos = (
            Pedido.objects.filter(
                restaurante=restaurante,
                estado='abierto',
                items__enviado_cocina=True
            )
            .select_related('mesa', 'mesero')
            .prefetch_related('items__producto', 'items__comensal')
            .distinct()
            .order_by('creado')
        )

        ahora = timezone.now()
        respuesta = []

        for pedido in pedidos:
            detalles_qs = pedido.items.filter(enviado_cocina=True, cancelado=False).select_related('producto', 'comensal').order_by('fecha')
            detalles_data = PedidoDetalleSerializer(detalles_qs, many=True).data

            if not detalles_data:
                continue

            mesa = pedido.mesa
            mesero = pedido.mesero

            tiempo_minutos = int(max((ahora - pedido.creado).total_seconds() // 60, 0))

            respuesta.append({
                'id': pedido.id,
                'creado': pedido.creado,
                'tiempo_espera_minutos': tiempo_minutos,
                'mesa': {
                    'id': mesa.id,
                    'nombre': getattr(mesa, 'nombre', None)
                } if mesa else None,
                'mesero': {
                    'id': mesero.id,
                    'nombre': mesero.get_full_name() or mesero.username
                } if mesero else None,
                'detalles': detalles_data
            })

        return Response(respuesta)
    
    @extend_schema(
        description="Obtiene los detalles (productos) de un pedido específico.",
        responses={200: PedidoDetalleSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        """Obtiene los detalles (productos) de un pedido específico."""
        try:
            pedido = self.get_object()
            detalles = PedidoDetalle.objects.filter(pedido=pedido).select_related(
                'producto', 'comensal'
            ).order_by('fecha')
            
            serializer = PedidoDetalleSerializer(detalles, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Error obteniendo detalles del pedido: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
