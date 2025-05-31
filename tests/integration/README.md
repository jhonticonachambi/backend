# Pruebas de Integración

## Descripción
Las pruebas de integración verifican que los componentes del sistema funcionen correctamente cuando trabajan juntos, incluyendo:
- Controladores + Modelos + Base de datos
- Rutas HTTP completas
- Middleware de autenticación
- Flujos completos de usuario

## Estructura
```
tests/integracion/
├── setup.js                       # Configuración de BD en memoria y utilidades
├── auth.integration.test.js        # Pruebas de autenticación
└── README.md                      # Esta documentación
```

## Configuración

### Dependencias requeridas
```bash
npm install --save-dev supertest mongodb-memory-server
```

### Variables de entorno para testing
Crear archivo `.env.test` (opcional):
```
NODE_ENV=test
JWT_SECRET=test_jwt_secret_key
MONGODB_URI=memory://test
```

## Ejecución

### Ejecutar solo pruebas de integración
```bash
npm test -- tests/integracion
```

### Ejecutar test específico
```bash
npm test -- tests/integracion/auth.integration.test.js
```

### Con cobertura
```bash
npm run test:coverage -- tests/integracion
```

### En modo watch para desarrollo
```bash
npm test -- --watch tests/integracion
```

## Pruebas Implementadas

### Auth Integration Tests
- ✅ Login exitoso con credenciales válidas
- ✅ Falla con email inválido
- ✅ Falla con password inválido
- ✅ Falla con email faltante
- ✅ Falla con password faltante
- ✅ Falla con credenciales vacías
- ✅ Validación de estructura de token JWT
- ✅ Manejo de diferentes roles de usuario
- ✅ No exposición de información sensible

## Características

### Base de datos en memoria
- Usa MongoDB Memory Server para aislamiento
- Cada test comienza con BD limpia
- No interfiere con datos reales

### Requests HTTP reales
- Usa Supertest para hacer requests HTTP completos
- Prueba toda la cadena: rutas → middleware → controladores → modelos
- Valida respuestas HTTP reales

### Cleanup automático
- Setup/teardown automático de BD
- Limpieza entre tests
- No deja datos residuales

## Próximas pruebas a implementar
- [ ] Registro de usuarios
- [ ] Rutas protegidas con JWT
- [ ] CRUD de proyectos
- [ ] Sistema de postulaciones
- [ ] Notificaciones

## Troubleshooting

### Error de conexión a MongoDB
```bash
# Si MongoDB Memory Server no inicia
npm install --save-dev mongodb-memory-server --force
```

### Timeout en tests
```javascript
// Aumentar timeout en Jest
jest.setTimeout(30000);
```

### Variables de entorno
Verificar que las variables de entorno estén correctamente configuradas en tu proyecto.
