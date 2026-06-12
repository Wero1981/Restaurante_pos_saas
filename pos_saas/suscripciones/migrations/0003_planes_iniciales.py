from django.db import migrations


def crear_planes_iniciales(apps, schema_editor):
    Plan = apps.get_model("suscripciones", "Plan")
    planes = [
        {
            "nombre": "Basico",
            "precio": "299.00",
            "limite_usuarios": 5,
            "limite_sucursales": 1,
            "limi_cajas": 1,
        },
        {
            "nombre": "Profesional",
            "precio": "599.00",
            "limite_usuarios": 15,
            "limite_sucursales": 3,
            "limi_cajas": 3,
        },
        {
            "nombre": "Premium",
            "precio": "999.00",
            "limite_usuarios": 50,
            "limite_sucursales": 10,
            "limi_cajas": 10,
        },
    ]
    for datos in planes:
        nombre = datos["nombre"]
        valores = {
            clave: valor for clave, valor in datos.items() if clave != "nombre"
        }
        valores["activo"] = True
        existentes = Plan.objects.filter(nombre=nombre).order_by("id")

        if existentes.exists():
            existentes.update(**valores)
        else:
            Plan.objects.create(nombre=nombre, **valores)


class Migration(migrations.Migration):
    dependencies = [
        ("suscripciones", "0002_plan_limi_cajas"),
    ]

    operations = [
        migrations.RunPython(crear_planes_iniciales, migrations.RunPython.noop),
    ]
