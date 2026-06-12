import api from '../services/api';
import { downloadTicketPdf } from './ticketPrinter';

const downloadFallback = (ticketData, mensaje) => {
  downloadTicketPdf(ticketData);
  return {
    resultado: 'descargado',
    mensaje,
  };
};

export const printOrDownloadTicket = async ({ ventaId, ticketData }) => {
  if (!ventaId) {
    return downloadFallback(
      ticketData,
      'La venta no tiene un identificador válido. Se descargó el PDF del ticket.'
    );
  }

  try {
    const response = await api.get('/impresion/configuraciones/activas/');
    const configuraciones = response.data?.configuraciones;
    const configuracion = Array.isArray(configuraciones)
      ? configuraciones.find(
          (item) =>
            item.tipo_comprobante === 'ticket' &&
            item.impresora?.activo !== false
        )
      : null;

    if (!configuracion) {
      return downloadFallback(
        ticketData,
        'No hay una impresora de tickets configurada. Se descargó el PDF.'
      );
    }

    const printResponse = await api.post('/impresion/ventas/imprimir/', {
      venta_id: ventaId,
      configuracion_id: configuracion.id,
    });

    return {
      resultado: 'impreso',
      mensaje: printResponse.data?.mensaje,
      impresora: printResponse.data?.impresora,
    };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    if (status === 400 || status === 404) {
      return downloadFallback(
        ticketData,
        message
          ? `${message}. Se descargó el PDF del ticket.`
          : 'No fue posible usar la impresora. Se descargó el PDF del ticket.'
      );
    }

    throw error;
  }
};
