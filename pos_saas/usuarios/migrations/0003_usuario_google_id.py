from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("usuarios", "0002_alter_usuario_apellidom_alter_usuario_apellidop"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuario",
            name="google_id",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
