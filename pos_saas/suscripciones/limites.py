from rest_framework.exceptions import ValidationError

from .models import Suscripcion


LIMITES_PRUEBA = {
    "restaurantes": 1,
    "usuarios": 4,
    "cajas": 1,
    "areas": 2,
    "estaciones": 2,
}


def obtener_suscripcion_principal(usuario, bloquear=False):
    queryset = Suscripcion.objects.select_related(
        "plan",
        "plan_pendiente",
        "usuario_principal",
    )

    if bloquear:
        queryset = queryset.select_for_update()

    try:
        return queryset.get(usuario_principal=usuario)
    except Suscripcion.DoesNotExist as error:
        raise ValidationError(
            {"detail": "El usuario principal no tiene una suscripción."}
        ) from error


def obtener_suscripcion(restaurante, bloquear=False):
    return obtener_suscripcion_principal(
        restaurante.propietario,
        bloquear=bloquear,
    )


def obtener_limites_efectivos(suscripcion):
    if (
        suscripcion.estado_pago == Suscripcion.ESTADO_AUTORIZADA
        and suscripcion.activa
        and not suscripcion.esta_vencida
    ):
        return {
            "restaurantes": suscripcion.plan.limite_sucursales,
            "usuarios": suscripcion.plan.limite_usuarios,
            "cajas": suscripcion.plan.limite_cajas,
            "areas": suscripcion.plan.limite_areas,
            "estaciones": suscripcion.plan.limite_estaciones,
        }

    if (
        suscripcion.estado_pago in {
            Suscripcion.ESTADO_TRIAL,
            Suscripcion.ESTADO_PENDIENTE,
        }
        and suscripcion.activa
        and suscripcion.en_periodo_prueba
    ):
        return LIMITES_PRUEBA.copy()

    raise ValidationError(
        {"detail": "La suscripción está vencida o inactiva."}
    )
