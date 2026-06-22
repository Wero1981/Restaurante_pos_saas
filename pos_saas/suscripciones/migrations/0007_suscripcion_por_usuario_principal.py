import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("suscripciones", "0006_migrar_suscripciones_principales"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="suscripcion",
            name="usuario_principal",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="suscripcion",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RemoveField(
            model_name="suscripcion",
            name="restaurante",
        ),
    ]
