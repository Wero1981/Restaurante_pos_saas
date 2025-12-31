import { useState, useEffect } from "react";
import api from '../services/api';
import { useNavigate } from "react-router-dom";
import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription
       } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";




export default function RegisterRestaurante() {
    const [data, setData] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        //Verificar si el restaurante ya está registrado
        const checkRestaurante = async () => {
            try {
                const response = await api.get('/restaurantes/mi-restaurante/');
                if (response.data) {
                    setData(response.data); 
                    
                }
            } catch (error) {
                // No hacer nada, el restaurante no está registrado
                console.log("No se encontró restaurante registrado.", error);
            }
        };
        checkRestaurante();
    }, []);

    const register = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            await api.post('/restaurantes/mi-restaurante/', data);
            setOpen(true);
        } catch (error) {
            console.error("Registration failed:", error);
            setError(error.response?.data?.message || "Error al registrar el restaurante");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-6">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-orange-500 text-white py-4 px-6">
                        <div className="flex items-center">
                            <i className="fas fa-store text-3xl mr-4"></i>
                            <div>
                                <h3 className="text-2xl font-bold">Registro de Restaurante</h3>
                                <small className="text-blue-100">Completa la información de tu restaurante</small>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start">
                                <i className="fas fa-exclamation-triangle mr-2 mt-1"></i>
                                <span className="flex-1">{error}</span>
                                <button type="button" className="text-red-700 hover:text-red-900" onClick={() => setError("")}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                        
                        <form onSubmit={register}>
                            {/* Información Básica */}
                            <div className="mb-6">
                                <h5 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-700">
                                    <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                                    Información Básica
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-utensils mr-2"></i>
                                            Nombre del Restaurante *
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="Ej: La Casa del Sabor"
                                            value = {data.nombre || ''}
                                            required
                                            onChange={e => setData({ ...data, nombre: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-phone mr-2"></i>
                                            Teléfono
                                        </label>
                                        <input 
                                            type="tel"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="Ej: +52 123 456 7890"
                                            value = {data.telefono || ''}
                                            onChange={e => setData({ ...data, telefono: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                            Dirección *
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="Ej: Av. Principal #123, Colonia Centro"
                                            value = {data.direccion || ''}
                                            required
                                            onChange={e => setData({ ...data, direccion: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-city mr-2"></i>
                                            Ciudad
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="Ej: Ciudad de México"
                                            value={data.ciudad || ''}
                                            onChange={e => setData({ ...data, ciudad: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-flag mr-2"></i>
                                            Estado/Provincia
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="Ej: CDMX"
                                            value={data.estado || ''}
                                            onChange={e => setData({ ...data, estado: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-envelope mr-2"></i>
                                            Email
                                        </label>
                                        <input 
                                            type="email"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="restaurante@ejemplo.com"
                                            value={data.email || ''}
                                            onChange={e => setData({ ...data, email: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-globe mr-2"></i>
                                            Sitio Web
                                        </label>
                                        <input 
                                            type="url"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="https://www.ejemplo.com"
                                            value={data.sitio_web || ''}
                                            onChange={e => setData({ ...data, sitio_web: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Configuración */}
                            <div className="mb-6">
                                <h5 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-700">
                                    <i className="fas fa-cog text-blue-600 mr-2"></i>
                                    Configuración
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-dollar-sign mr-2"></i>
                                            Moneda
                                        </label>
                                        <select 
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onChange={e => setData({ ...data, moneda: e.target.value })}
                                        >
                                            <option value={data.moneda || ""} disabled>{data.moneda ? data.moneda : "Seleccionar moneda"}</option>
                                            <option value="">Seleccionar moneda</option>
                                            <option value="MXN">MXN - Peso Mexicano</option>
                                            <option value="USD">USD - Dólar Americano</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-align-left mr-2"></i>
                                            Descripción
                                        </label>
                                        <textarea 
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            rows="4"
                                            placeholder="Describe tu restaurante, especialidades, ambiente, etc."
                                            onChange={e => setData({ ...data, descripcion: e.target.value })}
                                        ></textarea>
                                    </div>
                                    {/*Logo*/}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <i className="fas fa-image mr-2"></i>
                                            Logo del Restaurante
                                        </label>
                                        <input 
                                            type="url"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                            placeholder="https://www.ejemplo.com/logo.png"
                                            value={data.logo_url || ''}
                                            onChange={e => setData({ ...data, logo_url: e.target.value })} 
                                        />
                                        <small className="text-gray-500">Puedes subir tu logo a un servicio de alojamiento de imágenes y pegar la URL aquí.</small>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Botones */}
                            <div className="flex gap-4 justify-end pt-4 border-t">
                                <button 
                                    type="button" 
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    onClick={() => navigate(-1)}
                                    disabled={loading}
                                >
                                    <i className="fas fa-arrow-left mr-2"></i>
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Registrar Restaurante
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="text-center mt-4 text-gray-500">
                    <small>
                        <i className="fas fa-info-circle mr-1"></i>
                        Los campos marcados con * son obligatorios
                    </small>
                </div>
            </div>

            {/* Dialog para mostrar mensajes */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¡Registro Exitoso!</DialogTitle>
                        <DialogDescription>
                            El registro de tu restaurante se ha completado exitosamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cerrar
                        </Button>
                        <Button onClick={() => navigate('/productos')}>
                            Ir a Productos
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>   
        </div>

     
    );
}