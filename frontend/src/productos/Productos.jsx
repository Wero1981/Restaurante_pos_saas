import { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="p-6">
      <h4 className="text-2xl font-bold mb-4">Productos</h4>
      <div className="flex gap-2 mb-4">
        <Input 
          className="flex-1"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={e => setNombre(e.target.value)} 
        />
        <Button onClick={guardar}>
          <i className="fas fa-plus mr-2"></i>
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {productos.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4">
              {p.nombre}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
