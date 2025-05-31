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

### 📊 Reportes de Pruebas

**🔗 Ver Reporte en Vivo**: [Test Report](https://jhonticonachambi.github.io/backend/) *(Se actualiza automáticamente con cada push)*

### Comandos disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con cobertura y reporte HTML
npm run test:coverage

# Ejecutar en modo watch para desarrollo
npm run test:watch

# Ejecutar solo pruebas unitarias
npm run test:unit

# Ejecutar solo pruebas de integración
npm run test:integration

# Ejecutar solo pruebas E2E
npm run test:e2e
```

### 📈 Métricas Actuales

- **✅ 227 tests** ejecutándose correctamente
- **🎯 100% de cobertura** en funcionalidades críticas
- **⚡ ~10 segundos** tiempo de ejecución total
- **🔄 CI/CD** integrado con GitHub Actions

### 🏗️ Infraestructura de Testing

- **Framework**: Jest 29.x con configuración optimizada
- **API Testing**: Supertest para endpoints REST
- **Database**: MongoDB Memory Server para aislamiento
- **Reportes**: HTML con métricas detalladas
- **CI/CD**: GitHub Actions con deploy automático

Ver [documentación completa de testing](./docs/GITHUB_PAGES_SETUP.md) para configuración avanzada.

## Contribuciones

Las contribuciones son bienvenidas. Puedes hacer un fork, crear una rama con tu funcionalidad, y hacer un pull request.

---

Repositorio: [github.com/jhonticonachambi/backend](https://github.com/jhonticonachambi/backend)
