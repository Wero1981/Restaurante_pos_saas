"""
Comando de gestión para corregir productos con stock negativo.

Este comando identifica productos con stock negativo (que no sean -1 para stock ilimitado)
y permite al usuario decidir cómo corregirlos.

Uso:
    python manage.py corregir_stock_negativo
    python manage.py corregir_stock_negativo --auto-fix  # Pone en 0 automáticamente
    python manage.py corregir_stock_negativo --set-unlimited  # Los pone en -1 (ilimitado)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from productos.models import Producto


class Command(BaseCommand):
    help = 'Corrige productos con stock negativo (excepto -1 que es stock ilimitado)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--auto-fix',
            action='store_true',
            help='Establece automáticamente el stock en 0 para productos con stock negativo',
        )
        parser.add_argument(
            '--set-unlimited',
            action='store_true',
            help='Establece stock ilimitado (-1) para productos con stock negativo',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué se haría sin hacer cambios',
        )

    def handle(self, *args, **options):
        # Buscar productos con stock negativo (excepto -1)
        productos_negativos = Producto.objects.filter(stock__lt=-1) | Producto.objects.filter(
            stock__gt=-1, stock__lt=0
        )
        
        if not productos_negativos.exists():
            self.stdout.write(self.style.SUCCESS('✅ No hay productos con stock negativo'))
            return

        self.stdout.write(self.style.WARNING(
            f'\n⚠️  Encontrados {productos_negativos.count()} productos con stock negativo:\n'
        ))

        # Mostrar productos afectados
        for producto in productos_negativos:
            self.stdout.write(
                f'  - ID: {producto.id} | {producto.nombre} | Stock: {producto.stock} | '
                f'Restaurante: {producto.restaurante.nombre}'
            )

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n🔍 Modo dry-run: No se realizarán cambios'))
            return

        # Aplicar corrección automática si se especifica
        if options['auto_fix']:
            self._aplicar_correccion(productos_negativos, valor=0)
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Stock establecido en 0 para {productos_negativos.count()} productos'
            ))
        elif options['set_unlimited']:
            self._aplicar_correccion(productos_negativos, valor=-1)
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Stock establecido como ilimitado (-1) para {productos_negativos.count()} productos'
            ))
        else:
            # Modo interactivo
            self.stdout.write(self.style.WARNING(
                '\n¿Cómo deseas corregir estos productos?\n'
                '  1. Establecer stock en 0 (sin existencias)\n'
                '  2. Establecer stock ilimitado (-1)\n'
                '  3. Cancelar\n'
            ))
            
            opcion = input('Ingresa tu opción (1-3): ').strip()
            
            if opcion == '1':
                self._aplicar_correccion(productos_negativos, valor=0)
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ Stock establecido en 0 para {productos_negativos.count()} productos'
                ))
            elif opcion == '2':
                self._aplicar_correccion(productos_negativos, valor=-1)
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ Stock establecido como ilimitado (-1) para {productos_negativos.count()} productos'
                ))
            else:
                self.stdout.write(self.style.WARNING('❌ Operación cancelada'))

    def _aplicar_correccion(self, productos, valor):
        """Aplica la corrección de stock a los productos"""
        try:
            with transaction.atomic():
                for producto in productos:
                    producto.stock = valor
                    # Guardar sin validaciones para permitir el cambio
                    super(Producto, producto).save()
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al corregir stock: {str(e)}'))
            raise
