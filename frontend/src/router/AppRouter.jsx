import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../auth/Login';
import RegisterUser from '../auth/RegisterUser';
import RegisterRestaurante from '../restaurante/RegisterRestaurante';
import Productos from '../productos/Productos';
import Mesas from '../mesas/Mesas';
import Caja from '../caja/Caja';
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
          <Route path="/mesas" element={<Mesas />} />
          <Route path="/caja" element={<Caja />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}//frontend/src/router/AppRouter.jsx

