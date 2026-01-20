from django.core.validators import MinValueValidator
from django.db import models


class Impresora(models.Model):
    class TipoConexion(models.TextChoices):
        USB = "usb", "USB"
        RED = "network", "Red/Ethernet"
        SERIAL = "serial", "Serial"
        ARCHIVO = "file", "Archivo (depuración)"

    restaurante = models.ForeignKey(
        "restaurantes.Restaurante",
        on_delete=models.CASCADE,
        related_name="impresoras"
    )
    nombre = models.CharField(max_length=100)
    tipo_conexion = models.CharField(max_length=20, choices=TipoConexion.choices)
    configuracion = models.JSONField(default=dict, blank=True)
    ubicacion = models.CharField(max_length=100, blank=True)
    es_termica = models.BooleanField(default=True)
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("restaurante", "nombre")
        ordering = ("nombre",)

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_conexion_display()})"


class ConfigImpresion(models.Model):
    class TipoComprobante(models.TextChoices):
        TICKET = "ticket", "Ticket"
        FACTURA = "factura", "Factura"
        NOTA_CREDITO = "nota_credito", "Nota de Crédito"

    restaurante = models.ForeignKey(
        "restaurantes.Restaurante",
        on_delete=models.CASCADE,
        related_name="configuraciones_impresion"
    )
    impresora = models.ForeignKey(
        "impresion.Impresora",
        on_delete=models.CASCADE,
        related_name="configuraciones"
    )
    tipo_comprobante = models.CharField(
        max_length=50,
        choices=TipoComprobante.choices
    )
    titulo = models.CharField(max_length=120, blank=True)
    encabezado = models.TextField(blank=True)
    pie_pagina = models.TextField(blank=True)
    copias = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    opciones = models.JSONField(default=dict, blank=True)
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("restaurante", "tipo_comprobante")
        ordering = ("tipo_comprobante",)

    def __str__(self):
        return f"{self.get_tipo_comprobante_display()} - {self.impresora.nombre}"