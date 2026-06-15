from django.db import migrations, models


def verificar_usuarios_existentes(apps, schema_editor):
    Usuario = apps.get_model("usuarios", "Usuario")
    Usuario.objects.filter(email_verificado=False).update(email_verificado=True)


class Migration(migrations.Migration):
    dependencies = [
        ("usuarios", "0004_usuario_email_verificado"),
    ]

    operations = [
        migrations.RunPython(
            verificar_usuarios_existentes,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="usuario",
            name="email_verificado",
            field=models.BooleanField(default=True),
        ),
    ]
