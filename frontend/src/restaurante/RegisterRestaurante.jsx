import { useState } from "react";
import api from '../services/api';
import { useNavigate } from "react-router-dom";

export default function RegisterRestaurante() {
    const [data, setData] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const register = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            await api.post('/restaurantes/', data);
            navigate('/productos');
        } catch (error) {
            console.error("Registration failed:", error);
            setError(error.response?.data?.message || "Error al registrar el restaurante");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-lg-8 col-xl-6 mx-auto">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-primary text-white py-3">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-store fa-2x me-3"></i>
                                <div>
                                    <h3 className="mb-0">Registro de Restaurante</h3>
                                    <small>Completa la información de tu restaurante</small>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body p-4">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                                </div>
                            )}
                            
                            <form onSubmit={register}>
                                <div className="row">
                                    {/* Información Básica */}
                                    <div className="col-12">
                                        <h5 className="border-bottom pb-2 mb-4">
                                            <i className="fas fa-info-circle text-primary me-2"></i>
                                            Información Básica
                                        </h5>
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-utensils me-2"></i>
                                            Nombre del Restaurante *
                                        </label>
                                        <input 
                                            type="text"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: La Casa del Sabor"
                                            required
                                            onChange={e => setData({ ...data, nombre: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-phone me-2"></i>
                                            Teléfono
                                        </label>
                                        <input 
                                            type="tel"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: +52 123 456 7890"
                                            onChange={e => setData({ ...data, telefono: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-map-marker-alt me-2"></i>
                                            Dirección *
                                        </label>
                                        <input 
                                            type="text"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: Av. Principal #123, Colonia Centro"
                                            required
                                            onChange={e => setData({ ...data, direccion: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-city me-2"></i>
                                            Ciudad
                                        </label>
                                        <input 
                                            type="text"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: Ciudad de México"
                                            onChange={e => setData({ ...data, ciudad: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-flag me-2"></i>
                                            Estado/Provincia
                                        </label>
                                        <input 
                                            type="text"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: CDMX"
                                            onChange={e => setData({ ...data, estado: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-envelope me-2"></i>
                                            Email
                                        </label>
                                        <input 
                                            type="email"
                                            className="form-control form-control-lg" 
                                            placeholder="restaurante@ejemplo.com"
                                            onChange={e => setData({ ...data, email: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-globe me-2"></i>
                                            Sitio Web
                                        </label>
                                        <input 
                                            type="url"
                                            className="form-control form-control-lg" 
                                            placeholder="https://www.ejemplo.com"
                                            onChange={e => setData({ ...data, sitio_web: e.target.value })} 
                                        />
                                    </div>
                                    
                                    {/* Configuración */}
                                    <div className="col-12 mt-3">
                                        <h5 className="border-bottom pb-2 mb-4">
                                            <i className="fas fa-cog text-primary me-2"></i>
                                            Configuración
                                        </h5>
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-dollar-sign me-2"></i>
                                            Moneda
                                        </label>
                                        <select 
                                            className="form-select form-select-lg"
                                            onChange={e => setData({ ...data, moneda: e.target.value })}
                                        >
                                            <option value="">Seleccionar moneda</option>
                                            <option value="MXN">MXN - Peso Mexicano</option>
                                            <option value="USD">USD - Dólar Americano</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-chair me-2"></i>
                                            Número de Mesas
                                        </label>
                                        <input 
                                            type="number"
                                            className="form-control form-control-lg" 
                                            placeholder="Ej: 20"
                                            min="1"
                                            onChange={e => setData({ ...data, numero_mesas: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="col-12 mb-4">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-align-left me-2"></i>
                                            Descripción
                                        </label>
                                        <textarea 
                                            className="form-control" 
                                            rows="4"
                                            placeholder="Describe tu restaurante, especialidades, ambiente, etc."
                                            onChange={e => setData({ ...data, descripcion: e.target.value })}
                                        ></textarea>
                                    </div>
                                    
                                    {/* Botones */}
                                    <div className="col-12">
                                        <div className="d-flex gap-3 justify-content-end">
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary btn-lg px-4"
                                                onClick={() => navigate(-1)}
                                                disabled={loading}
                                            >
                                                <i className="fas fa-arrow-left me-2"></i>
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary btn-lg px-5"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Registrando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-save me-2"></i>
                                                        Registrar Restaurante
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div className="text-center mt-3 text-muted">
                        <small>
                            <i className="fas fa-info-circle me-1"></i>
                            Los campos marcados con * son obligatorios
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}