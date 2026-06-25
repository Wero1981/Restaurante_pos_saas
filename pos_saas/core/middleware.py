from django.http import JsonResponse

from restaurantes.models import UsuarioRestaurante
from core.restaurantes import get_restaurante_request


class RestauranteMiddleware:
    """
    Middleware para asignar el restaurante asociado al usuario autenticado en cada solicitud.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.restaurante = None

        if request.user.is_authenticated:
            try: 
                rel = UsuarioRestaurante.objects.filter(usuario=request.user).first()
                if rel:
                    request.restaurante = rel.restaurante

            except UsuarioRestaurante.DoesNotExist:
                request.restaurante = None

        response = self.get_response(request)
        return response
    
class SuscripcionMiddleware:
    """
    Middleware para verificar el estado de la suscripción del restaurante en cada solicitud.
    """

    rutas_permitidas = (
        '/api/usuarios/',
        '/api/suscripciones/',
        '/api/schema/',
        '/api/docs/',
        '/api/redoc/',
        '/admin/',
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS' or request.path.startswith(self.rutas_permitidas):
            return self.get_response(request)

        user = self._get_authenticated_user(request)
        if user is None:
            return self.get_response(request)

        request.user = user
        restaurante = get_restaurante_request(request)
        if not restaurante:
            return self.get_response(request)

        suscripcion = getattr(restaurante.propietario, 'suscripcion', None)
        if not suscripcion:
            return JsonResponse({
                'detail': 'El usuario principal no tiene una suscripción.',
                'codigo': 'SUSCRIPCION_REQUERIDA',
            }, status=403)

        if suscripcion.esta_vencida:
            return JsonResponse({
                'detail': 'La suscripción está vencida o inactiva.',
                'codigo': 'SUSCRIPCION_VENCIDA',
            }, status=403)

        response = self.get_response(request)
        return response

    def _get_authenticated_user(self, request):
        if request.user.is_authenticated:
            return request.user

        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            resultado = JWTAuthentication().authenticate(request)
        except Exception:
            return None

        if resultado is None:
            return None

        user, _token = resultado
        return user
