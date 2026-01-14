from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from caja.models import Caja
from caja.services import obtener_resumen_caja


class Command(BaseCommand):
    help = "Cierra automáticamente las cajas abiertas que excedan el tiempo configurado."

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-horas-abierta",
            type=int,
            default=24,
            help="Horas máximas permitidas con la caja abierta antes de cerrarla automáticamente.",
        )

    def handle(self, *args, **options):
        horas_maximas = options["max-horas-abierta"]
        if horas_maximas <= 0:
            self.stderr.write(self.style.ERROR("El parámetro --max-horas-abierta debe ser mayor a 0."))
            return

        limite = timezone.now() - timedelta(hours=horas_maximas)

        cajas_por_cerrar = Caja.objects.filter(abierta=True, fecha_apertura__lte=limite)
        if not cajas_por_cerrar.exists():
            self.stdout.write("No se encontraron cajas abiertas que superen el umbral configurado.")
            return

        for caja in cajas_por_cerrar:
            resumen = obtener_resumen_caja(caja)
            caja.registrar_cierre(resumen, cierre_automatico=True)
            self.stdout.write(self.style.SUCCESS(f"Caja {caja.id} cerrada automáticamente."))

        self.stdout.write(self.style.SUCCESS("Proceso completado."))
