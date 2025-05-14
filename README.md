# Sistema de Voluntariado con Machine Learning

Este proyecto es un **sistema de voluntariado** que permite la **gestión de voluntarios**, así como la **selección y recomendación automatizada mediante algoritmos de Machine Learning**.

## Tecnologías utilizadas

* **Node.js** + **Express.js** para el servidor backend
* **MongoDB** para la base de datos
* **JWT** para autenticación
* **Bcrypt** para el hash de contraseñas
* **Jest + Supertest** para pruebas unitarias y de integración

## Características principales

* Registro e inicio de sesión de voluntarios (con protección JWT)
* Creación y gestión de proyectos sociales
* Asignación de tareas a voluntarios
* Sistema de postulaciones y seguimiento
* Envio de notificaciones por email
* Generación de reportes en PDF
* Recomendación de voluntarios mediante ML (futuro o pendiente)

## Estructura del proyecto

```
backend/
├── config/             # Configuración de base de datos
├── controllers/        # Lógica de negocio y manejo de rutas
├── middleware/         # Middleware de autenticación
├── models/             # Modelos de datos (Mongoose)
├── reports/            # Reportes generados (PDF)
├── routes/             # Definición de endpoints REST
├── tests/              # Pruebas con Jest y Supertest
├── .env                # Variables de entorno
├── server.js           # Punto de entrada principal
```

## Instalación y ejecución

```bash
# Clona el repositorio
https://github.com/jhonticonachambi/backend.git
cd backend

# Instala dependencias
npm install

# Configura tus variables de entorno en un archivo .env

# Inicia el servidor
node server # o npm start
```

## Scripts disponibles

```json
"start": "node server.js",
"test": "jest"
```

## Variables de entorno

Ejemplo de archivo `.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/voluntariado
JWT_SECRET=your_jwt_secret
EMAIL_USER=you@example.com
EMAIL_PASS=yourpassword
```

## Testing

```bash
npm test
```

## Contribuciones

Las contribuciones son bienvenidas. Puedes hacer un fork, crear una rama con tu funcionalidad, y hacer un pull request.

---

Repositorio: [github.com/jhonticonachambi/backend](https://github.com/jhonticonachambi/backend)
