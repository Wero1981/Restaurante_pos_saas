from django.contrib import admin

from .models import ConfigImpresion, Impresora


@admin.register(Impresora)
class ImpresoraAdmin(admin.ModelAdmin):
    list_display = ("nombre", "restaurante", "tipo_conexion", "activo", "ubicacion")
    list_filter = ("tipo_conexion", "activo", "restaurante")
    search_fields = ("nombre", "restaurante__nombre")
    readonly_fields = ("creado", "actualizado")


@admin.register(ConfigImpresion)
class ConfigImpresionAdmin(admin.ModelAdmin):
    list_display = (
        "restaurante",
        "tipo_comprobante",
        "impresora",
        "activo",
        "copias",
    )
    list_filter = ("tipo_comprobante", "activo", "restaurante")
    search_fields = ("restaurante__nombre", "impresora__nombre")
    readonly_fields = ("creado", "actualizado")
