from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes as permission_decorator
from .serializers import RegistroSerializer
from drf_spectacular.utils import extend_schema
from django.contrib.auth import authenticate


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
        
        # Obtener rol y permisos del usuario
        from restaurantes.models import UsuarioRestaurante
        usuario_restaurante = UsuarioRestaurante.objects.filter(
            usuario=user,
            activo=True
        ).select_related('restaurante').prefetch_related('permisos').first()
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'nombre': user.nombre,
            'apellido': user.apellidoP,
        }
        
        # Agregar rol y permisos si existe la relación
        if usuario_restaurante:
            user_data['rol'] = usuario_restaurante.rol
            user_data['restaurante_id'] = usuario_restaurante.restaurante.id
            user_data['permisos'] = [
                {
                    'id': p.id,
                    'codigo': p.codigo,
                    'descripcion': p.descripcion
                }
                for p in usuario_restaurante.permisos.all()
            ]
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data
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
        })