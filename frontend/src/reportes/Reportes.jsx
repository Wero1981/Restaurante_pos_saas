import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  ReceiptText,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConPermiso } from '@/components/ConPermiso';
import { usePOS } from '@/context/POSContext';
import api from '@/services/api';

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const firstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 3,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const methodLabel = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('tarjeta')) return 'Tarjeta';
  if (normalized.includes('efectivo')) return 'Efectivo';
  if (normalized.includes('transfer')) return 'Transferencia';
  return value || 'Otro';
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const buildTable = (title, columns, rows) => `
  <h2>${escapeHtml(title)}</h2>
  <table border="1">
    <thead>
      <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map((row) => `
        <tr>
          ${columns.map((column) => `<td>${escapeHtml(column.value(row))}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const StatCard = ({ icon: Icon, label, value, tone = 'orange' }) => {
  const colors = {
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    slate: 'text-slate-700 bg-slate-50 border-slate-200',
  };

  return (
    <Card className={`border ${colors[tone]}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white/80">
          {createElement(Icon, { className: 'h-5 w-5' })}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyRow = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-gray-500">
      Sin información en el periodo seleccionado.
    </td>
  </tr>
);

export default function Reportes() {
  const { restauranteActivo } = usePOS();
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
  const [fechaFin, setFechaFin] = useState(todayInputValue);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarReportes = useCallback(async () => {
    if (!restauranteActivo?.id) {
      setDatos(null);
      setError('Selecciona un restaurante en la barra superior.');
      return;
    }

    setCargando(true);
    setError('');
    try {
      const response = await api.get('/ventas/reportes/', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      });
      setDatos(response.data);
    } catch (requestError) {
      console.error('Error cargando reportes:', requestError);
      setError(requestError.response?.data?.detail || 'No se pudieron cargar los reportes.');
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [fechaFin, fechaInicio, restauranteActivo?.id]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const resumen = datos?.resumen || {};
  const totalPorMetodo = useMemo(() => {
    const items = datos?.ventas_por_metodo || [];
    return items.reduce((acc, item) => {
      const key = String(item.metodo_pago || '').toLowerCase();
      if (key.includes('efectivo')) acc.efectivo += Number(item.total || 0);
      else if (key.includes('tarjeta')) acc.tarjeta += Number(item.total || 0);
      else acc.otros += Number(item.total || 0);
      return acc;
    }, { efectivo: 0, tarjeta: 0, otros: 0 });
  }, [datos?.ventas_por_metodo]);

  const exportarExcel = () => {
    if (!datos) return;

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #111827; }
            h2 { color: #f97316; margin-top: 24px; }
            table { border-collapse: collapse; margin-bottom: 18px; width: 100%; }
            th { background: #f97316; color: white; }
            th, td { padding: 8px; border: 1px solid #d1d5db; }
          </style>
        </head>
        <body>
          <h1>Reporte de ventas - ${escapeHtml(restauranteActivo?.nombre || 'Restaurante')}</h1>
          <p>Periodo: ${escapeHtml(fechaInicio)} a ${escapeHtml(fechaFin)}</p>
          ${buildTable('Resumen', [
            { label: 'Total ventas', value: () => money(resumen.total_ventas) },
            { label: 'Ventas', value: () => resumen.cantidad_ventas || 0 },
            { label: 'Ticket promedio', value: () => money(resumen.ticket_promedio) },
            { label: 'Entradas', value: () => money(resumen.total_entradas) },
            { label: 'Salidas', value: () => money(resumen.total_salidas) },
            { label: 'Balance neto', value: () => money(resumen.balance_neto) },
          ], [{}])}
          ${buildTable('Ventas por metodo de pago', [
            { label: 'Metodo', value: (row) => methodLabel(row.metodo_pago) },
            { label: 'Ventas', value: (row) => row.cantidad },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.ventas_por_metodo || [])}
          ${buildTable('Ventas diarias', [
            { label: 'Fecha', value: (row) => formatDate(row.fecha) },
            { label: 'Ventas', value: (row) => row.cantidad },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.ventas_diarias || [])}
          ${buildTable('Ventas mensuales', [
            { label: 'Mes', value: (row) => formatDate(row.mes) },
            { label: 'Ventas', value: (row) => row.cantidad },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.ventas_mensuales || [])}
          ${buildTable('Productos mas vendidos', [
            { label: 'Producto', value: (row) => row.producto__nombre },
            { label: 'Cantidad', value: (row) => number(row.cantidad) },
            { label: 'Veces vendido', value: (row) => row.veces_vendido },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.productos_mas_vendidos || [])}
          ${buildTable('Ventas por usuario', [
            { label: 'Usuario', value: (row) => row.usuario__nombre || row.usuario__email || 'Sin usuario' },
            { label: 'Ventas', value: (row) => row.cantidad },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.ventas_por_usuario || [])}
          ${buildTable('Movimientos de caja', [
            { label: 'Tipo', value: (row) => row.tipo },
            { label: 'Cantidad', value: (row) => row.cantidad },
            { label: 'Total', value: (row) => money(row.total) },
          ], datos.movimientos_por_tipo || [])}
          ${buildTable('Cajas', [
            { label: 'Caja', value: (row) => row.id },
            { label: 'Estado', value: (row) => row.abierta ? 'Abierta' : 'Cerrada' },
            { label: 'Apertura', value: (row) => formatDateTime(row.fecha_apertura) },
            { label: 'Cierre', value: (row) => formatDateTime(row.fecha_cierre) },
            { label: 'Monto inicial', value: (row) => money(row.monto_inicial) },
            { label: 'Monto final', value: (row) => money(row.monto_final) },
            { label: 'Ventas', value: (row) => money(row.total_ventas) },
            { label: 'Efectivo', value: (row) => money(row.total_efectivo) },
            { label: 'Tarjeta', value: (row) => money(row.total_tarjeta) },
            { label: 'Entradas', value: (row) => money(row.entradas) },
            { label: 'Salidas', value: (row) => money(row.salidas) },
          ], datos.cajas || [])}
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-ventas-${fechaInicio}-a-${fechaFin}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              Reportes
            </h1>
            <p className="mt-1 text-gray-600">
              Ventas, caja, métodos de pago y productos de {restauranteActivo?.nombre || 'tu restaurante'}.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-md border bg-white p-3 shadow-sm sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="fecha-inicio">Desde</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fecha-fin">Hasta</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
              />
            </div>
            <Button onClick={cargarReportes} disabled={cargando}>
              {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
              Consultar
            </Button>
            <ConPermiso permiso="exportar_reportes">
              <Button variant="outline" onClick={exportarExcel} disabled={!datos || cargando}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </ConPermiso>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {cargando && !datos ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={ReceiptText} label="Ventas totales" value={money(resumen.total_ventas)} />
              <StatCard icon={Wallet} label="Efectivo" value={money(totalPorMetodo.efectivo)} tone="green" />
              <StatCard icon={CreditCard} label="Tarjeta" value={money(totalPorMetodo.tarjeta)} tone="blue" />
              <StatCard icon={ArrowDownCircle} label="Salidas" value={money(resumen.total_salidas)} tone="red" />
              <StatCard icon={ArrowUpCircle} label="Entradas" value={money(resumen.total_entradas)} tone="green" />
              <StatCard icon={ReceiptText} label="Ventas realizadas" value={number(resumen.cantidad_ventas)} tone="slate" />
              <StatCard icon={Wallet} label="Ticket promedio" value={money(resumen.ticket_promedio)} tone="blue" />
              <StatCard icon={BarChart3} label="Balance neto" value={money(resumen.balance_neto)} />
            </div>

            <section className="grid gap-6 xl:grid-cols-2">
              <ReportTable
                title="Ventas por método de pago"
                columns={['Método', 'Ventas', 'Total']}
                rows={datos?.ventas_por_metodo || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3">{methodLabel(row.metodo_pago)}</td>
                    <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                  </>
                )}
              />
              <ReportTable
                title="Movimientos de caja"
                columns={['Tipo', 'Movimientos', 'Total']}
                rows={datos?.movimientos_por_tipo || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3 capitalize">{row.tipo}</td>
                    <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                  </>
                )}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ReportTable
                title="Ventas diarias"
                columns={['Fecha', 'Ventas', 'Total']}
                rows={datos?.ventas_diarias || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3">{formatDate(row.fecha)}</td>
                    <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                  </>
                )}
              />
              <ReportTable
                title="Ventas mensuales"
                columns={['Mes', 'Ventas', 'Total']}
                rows={datos?.ventas_mensuales || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3">{formatDate(row.mes)}</td>
                    <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                  </>
                )}
              />
            </section>

            <ReportTable
              title="Productos más vendidos"
              columns={['Producto', 'Cantidad', 'Veces vendido', 'Total']}
              rows={datos?.productos_mas_vendidos || []}
              renderRow={(row) => (
                <>
                  <td className="px-4 py-3">{row.producto__nombre}</td>
                  <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                  <td className="px-4 py-3 text-right">{number(row.veces_vendido)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                </>
              )}
            />

            <section className="grid gap-6 xl:grid-cols-2">
              <ReportTable
                title="Ventas por usuario"
                columns={['Usuario', 'Ventas', 'Total']}
                rows={datos?.ventas_por_usuario || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3">{row.usuario__nombre || row.usuario__email || 'Sin usuario'}</td>
                    <td className="px-4 py-3 text-right">{number(row.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.total)}</td>
                  </>
                )}
              />
              <ReportTable
                title="Cortes de caja"
                columns={['Caja', 'Estado', 'Apertura', 'Ventas', 'Final']}
                rows={datos?.cajas || []}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-3">#{row.id}</td>
                    <td className="px-4 py-3">{row.abierta ? 'Abierta' : 'Cerrada'}</td>
                    <td className="px-4 py-3">{formatDateTime(row.fecha_apertura)}</td>
                    <td className="px-4 py-3 text-right">{money(row.total_ventas)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(row.monto_final)}</td>
                  </>
                )}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ReportTable({ title, columns, rows, renderRow }) {
  return (
    <div className="overflow-hidden rounded-md border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? rows.map((row, index) => (
              <tr key={row.id || `${title}-${index}`} className="hover:bg-orange-50/40">
                {renderRow(row)}
              </tr>
            )) : <EmptyRow colSpan={columns.length} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
