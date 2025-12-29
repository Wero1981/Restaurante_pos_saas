import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function RegisterUser() {
    const [ form, setForm ] = useState({});
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/usuarios/registro/", form);
            localStorage.setItem("token", res.data.access);
            navigate("/restaurante");
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <form onSubmit={submit} className="container mt-5">
        <h3>Crear Usuario</h3>
        <input className="form-control mb-2" placeholder="Username"
            onChange={e => setForm({ ...form, username: e.target.value })} />
        <input className="form-control mb-2" placeholder="Nombre"
            onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <input className="form-control mb-2" placeholder="Email"
            onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" className="form-control mb-2" placeholder="Password"
            onChange={e => setForm({ ...form, password: e.target.value })} />
        <input className="form-control mb-2" placeholder="Nombre del restaurante"
            onChange={e => setForm({ ...form, restaurante_nombre: e.target.value })} />
        <button className="btn btn-primary">Registrar</button>
        </form>
    );
}