import { jsPDF } from 'jspdf';

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(toNumber(value));

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? String(value || '')
    : date.toLocaleString('es-MX');
};

export const downloadTicketPdf = (ticketData = {}) => {
  const items = Array.isArray(ticketData.items) ? ticketData.items : [];
  const pageHeight = Math.max(140, 92 + items.length * 14);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, pageHeight],
  });

  const center = 40;
  const left = 5;
  const right = 75;
  let y = 9;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(String(ticketData.negocio || 'Restaurante'), center, y, {
    align: 'center',
    maxWidth: 70,
  });

  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Ticket: #${ticketData.numeroTicket ?? 'N/D'}`, left, y);
  y += 4;
  pdf.text(`Fecha: ${formatDate(ticketData.fecha)}`, left, y);

  if (ticketData.mesa) {
    y += 4;
    pdf.text(`Mesa: ${ticketData.mesa}`, left, y);
  }
  if (ticketData.comensal) {
    y += 4;
    pdf.text(`Comensal: ${ticketData.comensal}`, left, y);
  }

  y += 6;
  pdf.line(left, y, right, y);
  y += 5;

  items.forEach((item) => {
    const quantity = toNumber(item.cantidad);
    const unitPrice = toNumber(item.precio_unitario);
    const subtotal = toNumber(item.subtotal || quantity * unitPrice);
    const nameLines = pdf.splitTextToSize(
      `${quantity} x ${item.nombre || 'Producto'}`,
      48
    );

    pdf.text(nameLines, left, y);
    pdf.text(formatCurrency(subtotal), right, y, { align: 'right' });
    y += Math.max(5, nameLines.length * 4);
    pdf.setTextColor(90);
    pdf.text(`P. unitario: ${formatCurrency(unitPrice)}`, left + 3, y);
    pdf.setTextColor(0);
    y += 6;
  });

  pdf.line(left, y, right, y);
  y += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('TOTAL', left, y);
  pdf.text(formatCurrency(ticketData.total), right, y, { align: 'right' });

  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Pago: ${ticketData.metodoPago || 'No especificado'}`, left, y);
  y += 10;
  pdf.text('Gracias por su compra', center, y, { align: 'center' });

  const ticketNumber = String(ticketData.numeroTicket ?? 'venta')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  pdf.save(`ticket-${ticketNumber || 'venta'}.pdf`);
};
