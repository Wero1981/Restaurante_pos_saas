// mesas/Mesas.jsx
import api from '../services/api';

export default function Mesas() {
  const crear = () => {
    api.post('/mesas/', { nombre: 'Mesa nueva' });
  };

  return (
    <>
      <h4>Mesas</h4>
      <button className="btn btn-secondary" onClick={crear}>
        Crear mesa
      </button>
    </>
  );
}
