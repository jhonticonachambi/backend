# 🚀 Pruebas End-to-End (E2E)

## ¿Qué son las pruebas E2E?

Las pruebas **End-to-End** simulan flujos completos de usuario desde el inicio hasta el final, verificando que todo el sistema funcione correctamente en conjunto.

## 🎯 Diferencias entre tipos de pruebas

| Tipo | Alcance | Velocidad | Realismo | Ejemplo |
|------|---------|-----------|----------|---------|
| **Unitarias** | 1 función | ⚡ Muy rápidas | 🔴 Baja | `validateEmail()` |
| **Integración** | Pocos componentes | 🟡 Rápidas | 🟡 Media | `Login API endpoint` |
| **E2E** | Sistema completo | 🔴 Lentas | 🟢 Alta | `Registro → Login → Postulación` |

## 📋 Flujos E2E implementados

### 1. 🔐 **Authentication Flow**
```javascript
Registro → Login → Acceso a recursos protegidos
```
- Usuario se registra con email/password
- Inicia sesión y recibe token JWT
- Puede acceder a endpoints protegidos

### 2. 👥 **Volunteer Application Flow**
```javascript
Registro → Búsqueda de proyectos → Postulación → Verificación
```
- Voluntario se registra
- Busca proyectos disponibles
- Se postula a un proyecto
- Verifica que la postulación fue creada

### 3. 📋 **Project Management Flow**
```javascript
Login coordinador → Crear proyecto → Crear tareas → Verificar
```
- Coordinador inicia sesión
- Crea un nuevo proyecto
- Asigna tareas al proyecto
- Verifica que todo fue creado correctamente

### 4. 🔄 **Complete Workflow**
```javascript
Registro → Postulación → Aceptación → Asignación → Completación
```
- Voluntario completo: desde registro hasta completar tarea
- Incluye interacción entre voluntario y coordinador
- Verifica notificaciones y estado de tareas

### 5. 📊 **Multi-User Scenarios**
```javascript
Múltiples usuarios → Interacciones simultáneas → Verificación de estado
```
- Múltiples usuarios interactuando al mismo tiempo
- Verificación de que el sistema maneja concurrencia
- Pruebas de conflictos y estado compartido

## 🛠️ Configuración

### Dependencias necesarias:
```json
{
  "supertest": "para pruebas HTTP",
  "mongodb-memory-server": "BD en memoria",
  "jest": "framework de pruebas"
}
```

### Setup especial:
- **Base de datos en memoria**: Cada prueba usa BD limpia
- **Datos de prueba**: Usuarios, proyectos y tareas predefinidos
- **Tokens JWT**: Autenticación real para cada usuario

## 🚀 Ejecución

```bash
# Ejecutar solo pruebas E2E
npm run test:e2e

# Ejecutar todas las pruebas
npm run test:all

# Ejecutar con reporte detallado
npm run test:e2e -- --verbose
```

## 📝 Estructura de archivos

```
tests/e2e/
├── setup.js              # Configuración de BD y datos de prueba
├── login.e2e.test.js      # Pruebas E2E completas
└── README.md              # Esta documentación
```

## 🎯 Casos de prueba específicos

### ✅ Authentication Flow
- **✓** Registro exitoso → Login → Token válido
- **✓** Verificación de datos de usuario
- **✓** Acceso a recursos protegidos

### ✅ Volunteer Application Flow  
- **✓** Búsqueda de proyectos disponibles
- **✓** Postulación con mensaje personalizado
- **✓** Verificación de postulación creada
- **✓** Estado de postulación correcto

### ✅ Project Management Flow
- **✓** Creación de proyecto por coordinador
- **✓** Asignación de múltiples tareas
- **✓** Verificación de relaciones proyecto-tarea
- **✓** Permisos de coordinador

### ✅ Complete Workflow
- **✓** Flujo completo de voluntario
- **✓** Interacción coordinador-voluntario
- **✓** Aceptación de postulación
- **✓** Asignación y completación de tareas
- **✓** Verificación de estados finales

### ✅ Multi-User Scenarios
- **✓** Registro simultáneo de múltiples usuarios
- **✓** Login concurrente
- **✓** Postulaciones múltiples al mismo proyecto
- **✓** Manejo de conflictos

## 🔍 Verificaciones realizadas

### 🔐 Seguridad
- Tokens JWT válidos
- Autorización correcta por rol
- No exposición de passwords

### 📊 Datos
- Integridad referencial (relaciones)
- Estados consistentes
- Validación de campos

### 🚀 Funcionalidad
- Flujos completos funcionando
- Manejo de errores
- Respuestas HTTP correctas

## 💡 Consejos para ejecutar

1. **Aislamiento**: Cada prueba es independiente
2. **Orden**: Las pruebas pueden ejecutarse en cualquier orden
3. **Datos**: Se limpian automáticamente entre pruebas
4. **Tiempo**: Son más lentas que unitarias/integración
5. **Realismo**: Simulan uso real del sistema

## 🐛 Debugging

Si una prueba falla:

1. **Verificar logs**: Las pruebas imprimen información útil
2. **Revisar datos**: Usar `console.log` para ver estado de BD
3. **Aislar**: Ejecutar solo la prueba problemática
4. **Endpoints**: Verificar que las rutas existan en el servidor

```bash
# Ejecutar solo una prueba específica
npm test -- --testNamePattern="Authentication Flow"

# Ejecutar con logs detallados
npm test -- --verbose
```

## 📈 Métricas esperadas

- **Tiempo de ejecución**: 30-60 segundos por suite completa
- **Cobertura**: Flujos principales del negocio
- **Casos exitosos**: 100% de pruebas pasando
- **Casos de error**: Incluidos en escenarios realistas
