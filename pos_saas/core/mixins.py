from restaurantes.models import Restaurante

class RestauranteActivoMixin:
    def get_restaurante_activo(self):
        restaurante_id = self.request.session.get('restaurante_activo_id')

        if restaurante_id:
            return Restaurante.objects.filter(
                id=restaurante_id,
                activo=True
            ).first()

        return None
