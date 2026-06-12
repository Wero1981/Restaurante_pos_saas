from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes as permission_decorator
from .serializers import RegistroSerializer
from drf_spectacular.utils import extend_schema
from django.contrib.auth import authenticate


def construir_datos_usuario(user):
    from restaurantes.models import UsuarioRestaurante

    relacion = (
        UsuarioRestaurante.objects.filter(usuario=user, activo=True)
        .select_related('restaurante')
        .prefetch_related('permisos')
        .first()
    )
    user_data = {
        'id': user.id,
        'email': user.email,
        'nombre': user.nombre,
        'apellido': user.apellidoP,
    }

    if relacion:
        user_data.update({
            'rol': relacion.rol,
            'restaurante_id': relacion.restaurante.id,
            'restaurante_nombre': relacion.restaurante.nombre,
            'restaurante_slug': relacion.restaurante.slug,
            'permisos': [
                {
                    'id': permiso.id,
                    'codigo': permiso.codigo,
                    'descripcion': permiso.descripcion,
                }
                for permiso in relacion.permisos.all()
            ],
        })

    return user_data


class LoginView(APIView):
    """Vista personalizada de login que retorna tokens y datos del usuario."""
    permission_classes = (AllowAny,)
    authentication_classes = []
    
    @extend_schema(
        request={'type': 'object', 'properties': {
            'email': {'type': 'string'},
            'password': {'type': 'string'},
        }},
        responses={200: {'type': 'object', 'properties': {
            'access': {'type': 'string'},
            'refresh': {'type': 'string'},
            'user': {'type': 'object'},
        }}}
    )
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(email=email, password=password)
        
        if user is None:
            return Response(
                {'detail': 'Credenciales inválidas'}, 
                status=401
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': construir_datos_usuario(user),
        })


class RegistroUsuarioView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    @extend_schema(
        request=RegistroSerializer,
        responses={200: {'type': 'object', 'properties': {
            'refresh': {'type': 'string'},
            'access': {'type': 'string'},
        }}}
    )
    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': construir_datos_usuario(user),
        })
