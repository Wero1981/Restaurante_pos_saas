from django.db import migrations


def crear_permiso_administrar_mesas(apps, schema_editor):
    Permiso = apps.get_model('restaurantes', 'Permiso')
    Permiso.objects.get_or_create(
        codigo='administrar_mesas',
        defaults={'descripcion': 'Administrar mesas y áreas'},
    )


def eliminar_permiso_administrar_mesas(apps, schema_editor):
    Permiso = apps.get_model('restaurantes', 'Permiso')
    Permiso.objects.filter(codigo='administrar_mesas').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('restaurantes', '0011_areaservicio'),
    ]

    operations = [
        migrations.RunPython(
            crear_permiso_administrar_mesas,
            eliminar_permiso_administrar_mesas,
        ),
    ]
