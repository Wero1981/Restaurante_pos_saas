# Restaurante POS SaaS

Sistema de Punto de Venta (POS) para Restaurantes - Una aplicación web SaaS construida con Flask.

## 🚀 Características

- **Multi-tenant**: Soporte para múltiples restaurantes en una sola instalación
- **Gestión de Productos**: Administra tu menú con categorías y precios
- **Punto de Venta (POS)**: Interfaz intuitiva para crear órdenes rápidamente
- **Historial de Órdenes**: Consulta y gestiona todas las órdenes realizadas
- **Autenticación**: Sistema seguro de login para cada restaurante
- **Responsive**: Funciona en computadoras, tablets y móviles

## 📋 Requisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

## 🔧 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/Wero1981/Restaurante_pos_saas.git
cd Restaurante_pos_saas
```

2. **Crear un entorno virtual (recomendado):**
```bash
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Linux/Mac:
source venv/bin/activate
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

4. **Inicializar la base de datos:**
```bash
python init_db.py
```

Esto creará:
- La base de datos con todas las tablas necesarias
- Un usuario demo con credenciales: `demo` / `demo123`
- Productos de ejemplo para probar el sistema

## 🚀 Uso

1. **Iniciar la aplicación:**
```bash
python run.py
```

2. **Acceder a la aplicación:**
Abre tu navegador y ve a: `http://localhost:5000`

3. **Login:**
- Usuario: `demo`
- Contraseña: `demo123`

O regístrate con tu propio restaurante.

## 📱 Funcionalidades

### Gestión de Productos
- Agregar nuevos productos al menú
- Editar información de productos
- Activar/desactivar productos
- Organizar por categorías
- Establecer precios

### Punto de Venta (POS)
- Seleccionar productos con un clic
- Añadir múltiples items a la orden
- Ajustar cantidades fácilmente
- Asignar número de mesa
- Calcular totales automáticamente
- Completar órdenes

### Historial de Órdenes
- Ver todas las órdenes históricas
- Consultar detalles de cada orden
- Filtrar por estado (pendiente/completada)
- Marcar órdenes como completadas

## 🏗️ Estructura del Proyecto

```
Restaurante_pos_saas/
├── app/
│   ├── __init__.py          # Inicialización de Flask
│   ├── models.py            # Modelos de base de datos
│   ├── routes.py            # Rutas y controladores
│   ├── templates/           # Plantillas HTML
│   │   ├── base.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── pos.html
│   │   ├── products.html
│   │   └── orders.html
│   └── static/              # Archivos estáticos
├── run.py                   # Punto de entrada de la aplicación
├── init_db.py              # Script de inicialización de BD
├── requirements.txt         # Dependencias Python
└── README.md               # Este archivo
```

## 🔐 Seguridad

- Las contraseñas se almacenan hasheadas con Werkzeug
- Autenticación mediante Flask-Login
- Protección de rutas con `@login_required`
- Aislamiento de datos por usuario (multi-tenancy)

## 🛠️ Tecnologías

- **Backend**: Flask (Python)
- **Base de Datos**: SQLite (SQLAlchemy ORM)
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap 5
- **Iconos**: Bootstrap Icons
- **Autenticación**: Flask-Login

## 📝 Configuración Avanzada

### Variables de Entorno

Puedes configurar las siguientes variables de entorno:

- `SECRET_KEY`: Clave secreta para sesiones (por defecto: 'dev-secret-key-change-in-production')
- Para producción, cambia la clave secreta:

```bash
export SECRET_KEY='tu-clave-secreta-super-segura'
```

### Base de Datos

Por defecto usa SQLite. Para producción, considera PostgreSQL o MySQL modificando la configuración en `app/__init__.py`:

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://usuario:password@localhost/dbname'
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Autor

Wero1981

## 📞 Soporte

Si tienes preguntas o problemas, por favor abre un issue en GitHub.