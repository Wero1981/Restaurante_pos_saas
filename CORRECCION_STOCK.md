# Corrección de Bug: Stock Negativo

## Problema Identificado

El sistema tenía un error crítico donde el stock de productos se decrementaba **dos veces**:

1. **Primera vez**: Al agregar un producto al pedido ([ventas/views.py](pos_saas/ventas/views.py#L356))
2. **Segunda vez**: Al crear la venta final ([ventas/serializers.py](pos_saas/ventas/serializers.py#L53))

Esto resultaba en:
- Stock con valores negativos (ej: -10.000)
- Inconsistencia en el inventario
- Errores al intentar agregar productos

## Solución Implementada

### 1. Eliminación de Decremento Duplicado
**Archivo**: `pos_saas/ventas/views.py` (líneas 353-355)

**Cambio**: Eliminado el decremento de stock al agregar productos al pedido. El stock ahora solo se decrementa al crear la venta final.

**Razón**: Los pedidos pueden cancelarse, por lo que no tiene sentido decrementar stock hasta que la venta se confirme.

### 2. Mejora de Validación en Ventas
**Archivo**: `pos_saas/ventas/serializers.py` (líneas 47-59)

**Cambio**: Agregada validación explícita de stock antes de decrementar:
```python
if producto.stock != -1:
    if producto.stock < d['cantidad']:
        raise serializers.ValidationError(
            f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}"
        )
    producto.stock -= d['cantidad']
    producto.save()
```

### 3. Eliminación de Validación Prematura
**Archivo**: `pos_saas/ventas/views.py` (líneas 313-320)

**Cambio**: Removida la validación de stock al agregar productos al pedido, ya que el stock se reserva solo al crear la venta final.

### 4. Validación en Modelo
**Archivo**: `pos_saas/productos/models.py`

**Cambio**: Agregados métodos `clean()` y `save()` personalizados para evitar stock negativo:
```python
def clean(self):
    """Validar que el stock no sea negativo (excepto -1 que significa ilimitado)"""
    if self.stock is not None and self.stock < -1:
        raise ValidationError({
            'stock': 'El stock no puede ser menor a -1. Use -1 para stock ilimitado o valores >= 0.'
        })

def save(self, *args, **kwargs):
    """Override save para ejecutar validaciones"""
    self.full_clean()
    super().save(*args, **kwargs)
```

### 5. Comando de Corrección
**Archivo**: `pos_saas/productos/management/commands/corregir_stock_negativo.py`

**Nuevo comando** para corregir stock negativo existente:

```bash
# Ver productos afectados sin hacer cambios
python manage.py corregir_stock_negativo --dry-run

# Establecer stock en 0
python manage.py corregir_stock_negativo --auto-fix

# Establecer stock ilimitado (-1)
python manage.py corregir_stock_negativo --set-unlimited

# Modo interactivo
python manage.py corregir_stock_negativo
```

## Corrección Aplicada

Se ejecutó el comando y se corrigieron **2 productos** con stock negativo:

- ID: 3 | Taco Barbacoa | Stock: -10.000 → 0.000
- ID: 4 | P Barbacoa | Stock: -7.000 → 0.000

## Flujo Correcto Ahora

1. **Agregar producto al pedido**: ✅ NO se decrementa stock
2. **Enviar a cocina**: ✅ NO se decrementa stock
3. **Crear venta final**: ✅ SE VALIDA Y DECREMENTA stock
4. **Cerrar pedido**: ✅ Mesa liberada, comensales eliminados

## Stock Ilimitado

Los productos con stock `-1` se consideran de stock ilimitado y nunca se validan ni decrementan.

## Prevención Futura

- ✅ Validación en modelo previene guardado con stock < -1
- ✅ Validación en serializer previene ventas con stock insuficiente
- ✅ Comando disponible para detectar y corregir inconsistencias
- ✅ Stock solo se decrementa una vez, al momento de la venta

## Recomendaciones

1. Si deseas permitir cancelación de pedidos, considera agregar un endpoint para eliminar detalles de pedido
2. Considera agregar un sistema de reserva de stock temporal mientras el pedido está activo
3. Monitorea el stock regularmente con el comando `corregir_stock_negativo --dry-run`
