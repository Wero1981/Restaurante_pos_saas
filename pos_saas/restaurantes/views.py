import re
import unicodedata

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import Restaurante, UsuarioRestaurante, Permiso
from .serializer import RestauranteSerializer, UsuarioRestauranteSerializer, PermisoSerializer
from usuarios.models import Usuario
from core.permissions import EsAdmin, TienePermisoRestaurante
from core.restaurantes import get_restaurante_request


def format_restaurant_email(restaurante, value):
    """Normaliza el correo del usuario usando el slug del restaurante."""
    if not value:
        return ''

    raw_value = (value or '').strip().lower()
    local_part = raw_value
    domain_part = ''

    if '@' in raw_value:
        local_part, _, domain_part = raw_value.partition('@')

    normalized_local = unicodedata.normalize('NFD', local_part)
    normalized_local = normalized_local.encode('ascii', 'ignore').decode('ascii')
    normalized_local = re.sub(r'[^a-z0-9._-]', '', normalized_local)

    if restaurante and restaurante.slug:
        domain_part = f'{restaurante.slug}.com'
    elif not domain_part:
        domain_part = ''

    if not normalized_local or not domain_part:
        return ''

    return f'{normalized_local}@{domain_part}'

@extend_schema_view(
    retrieve=extend_schema(
        description="Obtiene la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    ),
    update=extend_schema(
        description="Actualiza la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente la información del restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    ),
    destroy=extend_schema(
        description="Elimina el restaurante asociado al usuario autenticado.",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del restaurante'
            )
        ]
    )

)
class RestauranteViewSet(viewsets.ModelViewSet):
    serializer_class = RestauranteSerializer
    permission_classes = [IsAuthenticated, TienePermisoRestaurante]
    permiso_requerido = None  # Sin permiso específico, solo autenticado

    def get_queryset(self):
        """Obtiene el restaurante asociado al usuario autenticado."""
        return Restaurante.objects.filter(propietario=self.request.user)
    
    @extend_schema(summary="Completar datos del restaurante asociado al usuario autenticado.")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Gestionar información del restaurante del usuario autenticado",
        description="GET: Obtiene el restaurante. PUT/PATCH/POST: Actualiza el restaurante sin necesidad de especificar ID",
        request=RestauranteSerializer,
        responses={200: RestauranteSerializer}
    )
    @action(detail=False, methods=['get', 'post', 'put', 'patch'], url_path='mi-restaurante')
    def mi_restaurante(self, request):
        """Obtiene o actualiza el restaurante del usuario autenticado sin necesidad de ID"""
        try:
            # Buscar restaurantes del usuario
            restaurantes = Restaurante.objects.filter(propietario=request.user, activo=True)

            if not restaurantes.exists():
                return Response(
                    {"error": "No se encontró un restaurante asociado a este usuario"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            restaurante = restaurantes.first()
            
            # GET: Retornar información
            if request.method == 'GET':
                serializer = self.get_serializer(restaurante)
                return Response(serializer.data)
            
            # POST/PUT/PATCH: Actualizar información
            else:
                serializer = self.get_serializer(restaurante, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
                
        except Restaurante.DoesNotExist:
            return Response(
                {"error": "No se encontró un restaurante asociado a este usuario"},
                status=status.HTTP_404_NOT_FOUND
            )


@extend_schema_view(
    list=extend_schema(description="Lista todos los usuarios del restaurante"),
    retrieve=extend_schema(
        description="Obtiene los detalles de un usuario específico",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del usuario del restaurante'
            )
        ]
    ),
    create=extend_schema(description="Crea un nuevo usuario para el restaurante"),
    update=extend_schema(
        description="Actualiza un usuario del restaurante",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del usuario del restaurante'
            )
        ]
    ),
    partial_update=extend_schema(
        description="Actualiza parcialmente un usuario del restaurante",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del usuario del restaurante'
            )
        ]
    ),
    destroy=extend_schema(
        description="Desactiva un usuario del restaurante",
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID del usuario del restaurante'
            )
        ]
    )
)
class UsuarioRestauranteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar usuarios del restaurante."""
    serializer_class = UsuarioRestauranteSerializer
    permission_classes = [IsAuthenticated, EsAdmin]

    def get_queryset(self):
        """Obtiene los usuarios del restaurante asociado al usuario autenticado."""
        restaurante = get_restaurante_request(self.request)
        if not restaurante:
            return UsuarioRestaurante.objects.none()
        
        return UsuarioRestaurante.objects.filter(
            restaurante=restaurante
        ).select_related('usuario', 'restaurante')
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo usuario para el restaurante."""
        restaurante = get_restaurante_request(request)
        if not restaurante:
            return Response(
                {'error': 'No se encontró un restaurante asociado a este usuario'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                email_normalizado = format_restaurant_email(restaurante, request.data.get('email'))
                if not email_normalizado:
                    return Response(
                        {'email': ['No se pudo generar un correo válido. Verifica el slug del restaurante y el identificador.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Crear el usuario
                usuario_data = {
                    'email': email_normalizado,
                    'password': request.data.get('password'),
                    'nombre': request.data.get('nombre', ''),
                    'apellidoP': request.data.get('apellido', ''),
                }
                
                # Verificar que el email no exista
                if Usuario.objects.filter(email=usuario_data['email']).exists():
                    return Response(
                        {'email': ['Este email ya está registrado']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Crear usuario
                usuario = Usuario.objects.create_user(**usuario_data)
                
                # Crear la relación UsuarioRestaurante
                usuario_restaurante = UsuarioRestaurante.objects.create(
                    usuario=usuario,
                    restaurante=restaurante,
                    rol=request.data.get('rol', 'mesero'),
                    activo=request.data.get('activo', True)
                )
                
                # Asignar permisos si se proporcionaron
                if 'permisos_ids' in request.data:
                    permisos_ids = request.data.get('permisos_ids', [])
                    usuario_restaurante.permisos.set(permisos_ids)
                
                serializer = self.get_serializer(usuario_restaurante)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Actualizar un usuario del restaurante."""
        instance = self.get_object()
        
        try:
            with transaction.atomic():
                # Actualizar datos del usuario
                usuario = instance.usuario
                
                if 'email' in request.data:
                    email_normalizado = format_restaurant_email(instance.restaurante, request.data.get('email'))
                    if not email_normalizado:
                        return Response(
                            {'email': ['No se pudo generar un correo válido. Verifica el slug del restaurante y el identificador.']},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    # Verificar que el email no esté en uso por otro usuario
                    if Usuario.objects.filter(email=email_normalizado).exclude(id=usuario.id).exists():
                        return Response(
                            {'email': ['Este email ya está registrado']},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    usuario.email = email_normalizado
                
                if 'nombre' in request.data:
                    usuario.nombre = request.data['nombre']
                
                if 'apellido' in request.data:
                    usuario.apellidoP = request.data['apellido']
                
                if 'password' in request.data and request.data['password']:
                    usuario.set_password(request.data['password'])
                
                usuario.save()
                
                # Actualizar rol y estado activo
                if 'rol' in request.data:
                    instance.rol = request.data['rol']
                if 'activo' in request.data:
                    instance.activo = request.data['activo']
                    
                # Actualizar permisos si se proporcionaron
                if 'permisos_ids' in request.data:
                    permisos_ids = request.data.get('permisos_ids', [])
                    instance.permisos.set(permisos_ids)
                    
                instance.save()
                
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar (desactivar) un usuario del restaurante."""
        instance = self.get_object()
        instance.activo = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(description="Lista todos los permisos disponibles"),
)

class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para listar permisos disponibles."""
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, EsAdmin]
    queryset = Permiso.objects.all()
