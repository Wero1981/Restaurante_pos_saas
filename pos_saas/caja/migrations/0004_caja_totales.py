# Generated manually to align with Caja summary fields
from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("caja", "0003_caja_abierta_caja_usuario_movimientocaja"),
    ]

    operations = [
        migrations.AddField(
            model_name="caja",
            name="cierre_automatico",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_efectivo",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_movimientos_entrada",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_movimientos_salida",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_otros",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_tarjeta",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="caja",
            name="total_ventas",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
    ]
