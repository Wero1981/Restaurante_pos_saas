import api from '../services/api';
import { Button } from "@/components/ui/button";

export default function Mesas() {
  const crear = () => {
    api.post('/mesas/', { nombre: 'Mesa nueva' });
  };

  return (
    <div className="p-6">
      <h4 className="text-2xl font-bold mb-4">Mesas</h4>
      <Button variant="secondary" onClick={crear}>
        <i className="fas fa-plus mr-2"></i>
        Crear mesa
      </Button>
    </div>
  );
}
