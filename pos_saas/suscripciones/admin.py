from django.contrib import admin

from .models import Plan, Suscripcion


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "precio",
        "limite_usuarios",
        "limite_sucursales",
        "limi_cajas",
        "activo",
    )
    list_filter = ("activo",)


@admin.register(Suscripcion)
class SuscripcionAdmin(admin.ModelAdmin):
    list_display = ("restaurante", "plan", "inicio", "vence", "activa")
    list_filter = ("activa", "plan")
    search_fields = ("restaurante__nombre",)
