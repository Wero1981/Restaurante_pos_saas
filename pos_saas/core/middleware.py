from restaurantes.models import UsuarioRestaurante
from django.http import JsonResponse
from django.utils.timezone import now

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

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and request.restaurante:
            suscripcion = request.getattr(request.restaurante, 'suscripcion_actual', None)
            if suscripcion and suscripcion.esta_vencida():
                return JsonResponse({
                       'error': 'Suscripcion vencida. Por favor, renueve su suscripción para continuar utilizando el servicio.',
                       'codigo': 'SUBSCRIPCION_VENCIDA'

                   }, status=403)

        response = self.get_response(request)
        return response