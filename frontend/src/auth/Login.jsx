import { useState } from "react";
import api from '../services/api';
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [data, setData] = useState({});
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post('/usuarios/login/', data);
            localStorage.setItem('token', response.data.access);
            navigate('/productos');
        } catch (error) {
            console.error("Login failed:", error);
            setError("Email o contraseña incorrectos");
        }
    };
    
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5 col-lg-4">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <i className="fas fa-utensils fa-3x text-primary mb-3"></i>
                                    <h2 className="fw-bold">POS Restaurant</h2>
                                    <p className="text-muted">Inicia sesión para continuar</p>
                                </div>
                                
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        <i className="fas fa-exclamation-circle me-2"></i>
                                        {error}
                                    </div>
                                )}
                                
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            <i className="fas fa-envelope me-2"></i>Email
                                        </label>
                                        <input 
                                            type="email" 
                                            className="form-control form-control-lg" 
                                            placeholder="correo@ejemplo.com"
                                            required
                                            onChange={e => setData({ ...data, email: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="form-label">
                                            <i className="fas fa-lock me-2"></i>Contraseña
                                        </label>
                                        <input 
                                            type="password" 
                                            className="form-control form-control-lg" 
                                            placeholder="••••••••"
                                            required
                                            onChange={e => setData({ ...data, password: e.target.value })} 
                                        />
                                    </div>
                                    
                                    <button className="btn btn-primary btn-lg w-100 mb-3">
                                        <i className="fas fa-sign-in-alt me-2"></i>
                                        Iniciar Sesión
                                    </button>
                                    
                                    <div className="text-center">
                                        <Link to="/register-user" className="text-decoration-none">
                                            ¿No tienes cuenta? Regístrate aquí
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}