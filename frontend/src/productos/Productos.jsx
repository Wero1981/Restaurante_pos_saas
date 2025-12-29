// productos/Productos.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Productos() {
  const [nombre, setNombre] = useState('');
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get('/productos/').then(res => setProductos(res.data));
  }, []);

  const guardar = async () => {
    await api.post('/productos/', { nombre, precio: 50 });
    setNombre('');
  };

  return (
    <>
      <h4>Productos</h4>
      <input className="form-control mb-2"
        value={nombre}
        onChange={e => setNombre(e.target.value)} />
      <button className="btn btn-primary" onClick={guardar}>Agregar</button>

      <ul className="mt-3">
        {productos.map(p => <li key={p.id}>{p.nombre}</li>)}
      </ul>
    </>
  );
}
