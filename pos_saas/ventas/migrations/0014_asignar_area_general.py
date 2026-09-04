from django.db import migrations


def asignar_area_general(apps, schema_editor):
    AreaServicio = apps.get_model('restaurantes', 'AreaServicio')
    Restaurante = apps.get_model('restaurantes', 'Restaurante')
    Mesa = apps.get_model('ventas', 'Mesa')

    for restaurante_id in Restaurante.objects.values_list('id', flat=True):
        area, _ = AreaServicio.objects.get_or_create(
            restaurante_id=restaurante_id,
            nombre='General',
            defaults={'descripcion': 'Área predeterminada'},
        )
        Mesa.objects.filter(
            restaurante_id=restaurante_id,
            area__isnull=True,
        ).update(area=area)


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0013_mesa_area'),
    ]

    operations = [
        migrations.RunPython(asignar_area_general, migrations.RunPython.noop),
    ]
