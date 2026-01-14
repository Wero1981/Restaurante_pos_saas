# Generated manually to relate ventas with cajas
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("caja", "0004_caja_totales"),
        ("ventas", "0009_alter_ventadetalle_venta"),
    ]

    operations = [
        migrations.AddField(
            model_name="venta",
            name="caja",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="ventas", to="caja.caja"),
        ),
    ]
