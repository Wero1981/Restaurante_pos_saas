import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  ChefHat,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import heroImage from '@/assets/landing/pos-hero.png';

const features = [
  {
    icon: Store,
    title: 'Operación multi-restaurante',
    text: 'Administra matriz, sucursales, usuarios y permisos desde un solo panel.',
  },
  {
    icon: ReceiptText,
    title: 'Ventas y pedidos',
    text: 'Controla mesas, comensales, pedidos parciales, cocina, caja y tickets.',
  },
  {
    icon: BarChart3,
    title: 'Reportes descargables',
    text: 'Consulta ventas diarias, mensuales, efectivo, tarjeta, salidas y productos.',
  },
  {
    icon: ShieldCheck,
    title: 'Suscripción protegida',
    text: 'Bloqueo automático al vencer la prueba o el plan, con renovación guiada.',
  },
];

const workflows = [
  'Abre caja y registra movimientos',
  'Toma pedidos por mesa o venta rápida',
  'Envía productos a cocina',
  'Cobra en efectivo o tarjeta',
  'Cierra caja con totales claros',
  'Exporta reportes a Excel',
];

const plans = [
  {
    name: 'Básico',
    price: '$299',
    detail: 'Para restaurantes que empiezan a ordenar su operación.',
    items: ['1 restaurante', 'Usuarios esenciales', 'Caja y reportes'],
  },
  {
    name: 'Profesional',
    price: '$599',
    detail: 'Para equipos con más personal y operación diaria intensa.',
    items: ['Hasta 3 restaurantes', 'Más empleados', 'Más cajas abiertas'],
  },
  {
    name: 'Premium',
    price: '$999',
    detail: 'Para grupos que necesitan crecer con mayor control.',
    items: ['Sucursales ampliadas', 'Reportes avanzados', 'Mayor capacidad'],
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-gray-950/80 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <ChefHat className="h-6 w-6 text-orange-400" />
            POS Restaurant
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-200 md:flex">
            <a href="#operacion" className="hover:text-white">Operación</a>
            <a href="#reportes" className="hover:text-white">Reportes</a>
            <a href="#planes" className="hover:text-white">Planes</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link to="/register-user">Probar gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden bg-gray-950 pt-16 text-white">
        <img
          src={heroImage}
          alt="Sistema POS moderno para restaurante"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/76 to-gray-950/20" />
        <div className="relative mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-center px-5 py-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/15 px-4 py-2 text-sm text-orange-100">
              <CreditCard className="h-4 w-4" />
              Punto de venta para restaurantes con suscripción integrada
            </p>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl">
              POS Restaurant
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-200">
              Controla pedidos, mesas, caja, inventario, empleados, sucursales y reportes desde una experiencia pensada para la operación diaria.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600">
                <Link to="/register-user">Crear cuenta</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="operacion" className="border-b bg-white px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold md:text-4xl">Todo lo que pasa en el restaurante, en orden</h2>
            <p className="mt-4 text-lg text-gray-600">
              La pantalla principal está hecha para trabajar rápido: mesas, comandas, productos, cobros y cierre de caja sin saltar entre herramientas.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-md border bg-gray-50 p-5">
                  <Icon className="h-7 w-7 text-orange-500" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reportes" className="bg-gray-950 px-5 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Cierre, reportes y decisiones con números claros</h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              Revisa efectivo, tarjeta, ventas diarias, ventas mensuales, productos más vendidos, salidas de caja y exporta todo a Excel.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {workflows.map((item) => (
                <div key={item} className="flex items-center gap-3 text-gray-100">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/8 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Ventas del día" value="$12,840" />
              <Metric label="Tarjeta" value="$7,320" />
              <Metric label="Efectivo" value="$5,120" />
              <Metric label="Salidas" value="$400" />
            </div>
            <div className="mt-5 rounded-md bg-white p-4 text-gray-950">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Productos más vendidos</p>
                <BarChart3 className="h-5 w-5 text-orange-500" />
              </div>
              {['Tacos de ribeye', 'Agua fresca', 'Hamburguesa clásica', 'Postre de casa'].map((item, index) => (
                <div key={item} className="flex items-center justify-between border-t py-3 text-sm">
                  <span>{item}</span>
                  <span className="font-semibold">{42 - index * 7}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="bg-gray-50 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Planes para crecer a tu ritmo</h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                Empieza con prueba gratuita y elige un plan cuando tu operación esté lista para continuar.
              </p>
            </div>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link to="/register-user">Iniciar prueba</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className="rounded-md border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{plan.detail}</p>
                <p className="mt-5 text-4xl font-bold">{plan.price}<span className="text-base font-medium text-gray-500"> / mes</span></p>
                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-500 px-5 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Pon tu restaurante en control desde hoy</h2>
            <p className="mt-2 text-orange-50">Crea tu cuenta, registra tu restaurante y empieza con tu prueba.</p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-white bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700">
            <Link to="/register-user">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-white p-4 text-gray-950">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
