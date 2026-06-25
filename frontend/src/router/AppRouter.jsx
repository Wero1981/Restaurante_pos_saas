import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from '../landing/Landing';
import Login from '../auth/Login';
import RegisterUser from '../auth/RegisterUser';
import VerifyEmail from '../auth/VerifyEmail';
import RegisterRestaurante from '../restaurante/RegisterRestaurante';
import ListaRestaurantes from '../restaurante/ListaRestaurantes';
import Productos from '../productos/Productos';
import Inventario from '../productos/inventario';
import MovimientosEntrada from '../productos/MovimientosEntrada';
import Mesas from '../mesas/Mesas';
import Pedido from '../pedido/Pedido';
import Ordenes from '../ordenes/Ordenes';
import Caja from '../caja/Caja';
import GestionUsuarios from '../usuarios/GestionUsuarios';
import Suscripciones from '../suscripciones/Suscripciones';
import Reportes from '../reportes/Reportes';
import SinPermiso from '../layout/SinPermiso';
import Layout from '../layout/layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { RutaProtegida } from '../components/RutaProtegida';

export default function AppRouter() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Landing />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/verificar-correo" element={<VerifyEmail />} />
        <Route path="/sin-permiso" element={<SinPermiso />} />

        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Lista de restaurantes - solo admin */}
          <Route path="/restaurantes" element={
            <RutaProtegida permiso="administrar_usuarios">
              <ListaRestaurantes />
            </RutaProtegida>
          } />

          {/* Configuración del restaurante - solo admin */}
          <Route path="/restaurante" element={
            <RutaProtegida permiso="administrar_usuarios">
              <RegisterRestaurante />
            </RutaProtegida>
          } />

          {/* Rutas con permisos específicos */}
          <Route path="/productos" element={
            <RutaProtegida permiso="ver_productos">
              <Productos />
            </RutaProtegida>
          } />
          
          <Route path="/inventario" element={
            <RutaProtegida permiso="ver_inventario">
              <Inventario />
            </RutaProtegida>
          } />

          <Route path="/inventario/movimientos-entrada" element={
            <RutaProtegida permiso="editar_inventario">
              <MovimientosEntrada />
            </RutaProtegida>
          } />
          
          <Route path="/mesas" element={
            <RutaProtegida permisos={['crear_pedidos', 'ver_pedidos']}>
              <Mesas />
            </RutaProtegida>
          } />
          
          <Route path="/pedido" element={
            <RutaProtegida permiso="crear_pedidos">
              <Pedido />
            </RutaProtegida>
          } />

          <Route path="/ordenes" element={
            <RutaProtegida permisos={['ver_ordenes_cocina', 'ver_pedidos']}>
              <Ordenes />
            </RutaProtegida>
          } />
          
          <Route path="/usuarios" element={
            <RutaProtegida rol="admin">
              <GestionUsuarios />
            </RutaProtegida>
          } />

          <Route path="/suscripcion" element={
            <RutaProtegida rol="admin">
              <Suscripciones />
            </RutaProtegida>
          } />

          <Route path="/reportes" element={
            <RutaProtegida permiso="ver_reportes">
              <Reportes />
            </RutaProtegida>
          } />
          
          <Route path="/caja" element={
            <RutaProtegida permisos={['crear_ventas', 'ver_historial_ventas']}>
              <Caja />
            </RutaProtegida>
          } />
        </Route>
          <Route path="*" element={<SinPermiso />} />
      </Routes>
    </BrowserRouter>
  );
}
