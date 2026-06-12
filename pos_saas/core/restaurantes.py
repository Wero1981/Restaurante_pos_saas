from restaurantes.models import Restaurante, UsuarioRestaurante


def get_restaurante_request(request):
    """Return the restaurant selected by an authorized authenticated user."""
    user = request.user
    if not user.is_authenticated:
        return None

    restaurante_id = request.headers.get("X-Restaurante-ID")
    if restaurante_id:
        restaurante = Restaurante.objects.filter(
            id=restaurante_id,
            activo=True,
        ).first()
        if not restaurante:
            return None

        if restaurante.propietario_id == user.id:
            return restaurante

        autorizado = UsuarioRestaurante.objects.filter(
            usuario=user,
            restaurante=restaurante,
            activo=True,
        ).exists()
        return restaurante if autorizado else None

    relacion = (
        UsuarioRestaurante.objects.filter(usuario=user, activo=True)
        .select_related("restaurante")
        .first()
    )
    if relacion:
        return relacion.restaurante

    return Restaurante.objects.filter(
        propietario=user,
        activo=True,
    ).first()
