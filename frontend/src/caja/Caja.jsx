import api from '../services/api';
import { Button } from "@/components/ui/button";

export default function Caja() {
  const abrir = () => {
    api.post('/caja/', { monto_inicial: 500 });
  };

  return (
    <div className="p-6">
      <h4 className="text-2xl font-bold mb-4">Caja</h4>
      <Button className="bg-green-600 hover:bg-green-700" onClick={abrir}>
        <i className="fas fa-cash-register mr-2"></i>
        Abrir caja
      </Button>
    </div>
  );
}
