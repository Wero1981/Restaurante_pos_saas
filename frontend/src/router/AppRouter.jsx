import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../auth/Login';
import RegisterUser from '../auth/RegisterUser';
import RegisterRestaurante from '../restaurante/RegisterRestaurante';
import Productos from '../productos/Productos';
import Inventario from '../productos/inventario';
import Mesas from '../mesas/Mesas';
import Pedido from '../pedido/Pedido';
import Caja from '../caja/Caja';
import GestionUsuarios from '../usuarios/GestionUsuarios';
import Layout from '../layout/layout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register-user" element={<RegisterUser />} />

        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/restaurante" element={<RegisterRestaurante />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/mesas" element={<Mesas />} />
          <Route path="/pedido" element={<Pedido />} />
          <Route path="/usuarios" element={<GestionUsuarios />} />
          <Route path="/caja" element={<Caja />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}//frontend/src/router/AppRouter.jsx

