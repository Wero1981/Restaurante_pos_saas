// caja/Caja.jsx
import api from '../services/api';

export default function Caja() {
  const abrir = () => {
    api.post('/caja/', { monto_inicial: 500 });
  };

  return (
    <>
      <h4>Caja</h4>
      <button className="btn btn-success" onClick={abrir}>
        Abrir caja
      </button>
    </>
  );
}
