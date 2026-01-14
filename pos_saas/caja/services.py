from collections import defaultdict
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from ventas.models import Venta

from .models import MovimientoCaja


def _normalizar_metodo_pago(nombre):
    if not nombre:
        return 'otros'
    nombre = nombre.lower()
    if nombre in {'efectivo', 'cash'}:
        return 'efectivo'
    if nombre in {'tarjeta', 'tarjeta_credito', 'tarjeta_debito', 'card'}:
        return 'tarjeta'
    return 'otros'


def obtener_resumen_caja(caja):
    """Construye un resumen con ventas y movimientos para la caja proporcionada."""
    if caja is None:
        raise ValueError('Se requiere una caja para generar el resumen.')

    cierre_referencia = caja.fecha_cierre or timezone.now()

    Venta.objects.filter(
        restaurante=caja.restaurante,
        estado='pagada',
        caja__isnull=True,
        created_at__gte=caja.fecha_apertura,
        created_at__lte=cierre_referencia,
    ).update(caja=caja)

    ventas_qs = Venta.objects.filter(
        restaurante=caja.restaurante,
        caja=caja,
        estado='pagada',
        created_at__gte=caja.fecha_apertura,
        created_at__lte=cierre_referencia
    ).order_by('-created_at')

    total_ventas = ventas_qs.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
    ventas_por_metodo = defaultdict(Decimal)

    for agrupado in ventas_qs.values('metodo_pago').annotate(total=Sum('total')):
        metodo = _normalizar_metodo_pago(agrupado['metodo_pago'])
        ventas_por_metodo[metodo] += agrupado['total'] or Decimal('0.00')

    total_efectivo = ventas_por_metodo.get('efectivo', Decimal('0.00'))
    total_tarjeta = ventas_por_metodo.get('tarjeta', Decimal('0.00'))
    total_otros = total_ventas - total_efectivo - total_tarjeta

    ventas_detalle = [
        {
            'id': venta.id,
            'total': venta.total,
            'metodo_pago': venta.metodo_pago,
            'pedido': venta.pedido_id,
            'created_at': venta.created_at,
            'usuario': venta.usuario_id,
        }
        for venta in ventas_qs
    ]

    movimientos_qs = MovimientoCaja.objects.filter(caja=caja).order_by('-fecha')
    entradas = movimientos_qs.filter(tipo='entrada').aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
    salidas = movimientos_qs.filter(tipo='salida').aggregate(total=Sum('monto'))['total'] or Decimal('0.00')

    monto_final = caja.monto_inicial + total_efectivo + entradas - salidas

    return {
        'caja': {
            'id': caja.id,
            'restaurante': caja.restaurante_id,
            'usuario': caja.usuario_id,
            'monto_inicial': caja.monto_inicial,
            'fecha_apertura': caja.fecha_apertura,
            'fecha_cierre': caja.fecha_cierre,
        },
        'ventas': {
            'total': total_ventas,
            'por_metodo': {
                'efectivo': total_efectivo,
                'tarjeta': total_tarjeta,
                'otros': total_otros,
            },
            'conteo': ventas_qs.count(),
            'detalle': ventas_detalle,
        },
        'movimientos': {
            'entradas': entradas,
            'salidas': salidas,
            'detalle': [
                {
                    'id': movimiento.id,
                    'tipo': movimiento.tipo,
                    'monto': movimiento.monto,
                    'descripcion': movimiento.descripcion,
                    'fecha': movimiento.fecha,
                }
                for movimiento in movimientos_qs
            ],
        },
        'monto_final': monto_final,
        'generado_en': cierre_referencia,
    }