# Servicio de impresión local

Este módulo permite enviar tickets a impresoras térmicas compatibles con ESC/POS desde la API.

## Configuración de impresoras

1. **Agregar impresoras** desde el panel de administración (`Impresión → Impresoras`).
   - Selecciona el restaurante.
   - Define el tipo de conexión (`usb`, `network`, `serial`, `file`).
   - Completa el JSON de configuración con los parámetros del driver, por ejemplo:

```json
{
  "vendor_id": "0x04b8",
  "product_id": "0x0e15",
  "interface": 0,
  "in_endpoint": 0x82,
  "out_endpoint": 0x01
}
```

2. **Crear configuraciones de impresión** (`Impresión → Configuraciones`):
   - Asocia la impresora y define el tipo de comprobante (`ticket`, `factura`, etc.).
   - Personaliza encabezado, pie de página y número de copias por defecto.
   - `opciones` permite modificar el comportamiento del renderer. Ejemplo:

```json
{
  "mostrar_comensal": true,
  "corte_automatico": true
}
```

## Dependencias

Instala `python-escpos` y `pyusb` (ya incluidos en `requirements.txt`). En sistemas Linux puede ser necesario agregar permisos USB u obtener las reglas `udev` para que el proceso de Django acceda al dispositivo.

## Endpoint REST

`POST /api/impresion/ventas/imprimir/`

```json
{
  "venta_id": 42,
  "configuracion_id": 3,
  "copias": 2,
  "notas": "¡Gracias por su compra!"
}
```

- `configuracion_id` es opcional. Si se omite, se usará la primera configuración activa del restaurante.
- `copias` es opcional. Si se envía, sobrescribe el valor indicado en la configuración.

La respuesta incluye el nombre de la impresora objetivo y la cantidad de copias enviadas. Maneja errores por dependencias faltantes, mala configuración y fallas de conexión.

## Uso en código

```python
from impresion.models import ConfigImpresion
from impresion.services import LocalPrintService
from ventas.models import Venta

config = ConfigImpresion.objects.get(pk=1)
venta = Venta.objects.get(pk=42)
servicio = LocalPrintService(config.impresora, config)
servicio.imprimir_ticket_venta(venta, copias=1, notas="Propina incluida")
```

El renderer `VentaTicketRenderer` formatea automáticamente encabezado, detalles de la venta y totales, respetando las opciones definidas en la configuración.
