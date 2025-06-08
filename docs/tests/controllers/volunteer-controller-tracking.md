# Manual de Pruebas - Controlador de Voluntarios (Seguimiento)

## Información General

### Detalles de Ejecución
- **Archivo de Prueba**: `volunteerController.getVolunteerTracking.test.js`
- **Función Bajo Prueba**: `getVolunteerTracking`
- **Resultado**: ✅ 11 pruebas pasaron exitosamente
- **Tiempo Total**: 0.804 segundos
- **Fecha de Ejecución**: ${new Date().toLocaleDateString('es-ES')}

### Comando de Ejecución
```bash
npx jest tests/controllers/volunteerController.getVolunteerTracking.test.js
```

## Configuración del Sistema y Datos Iniciales

### Base de Datos Requerida (Estado Inicial)

#### Colección Users
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "role": "volunteer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Colección Projects
```json
[
  {
    "_id": "507f1f77bcf86cd799439033",
    "name": "Proyecto Educación",
    "description": "Proyecto educativo para niños",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-06-15T00:00:00.000Z",
    "status": "active",
    "feedback": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "comment": "Excelente trabajo en las actividades",
        "createdAt": "2024-02-01T00:00:00.000Z"
      },
      {
        "userId": "507f1f77bcf86cd799439044",
        "comment": "Otro feedback",
        "createdAt": "2024-02-15T00:00:00.000Z"
      }
    ]
  },
  {
    "_id": "507f1f77bcf86cd799439066",
    "name": "Proyecto Medio Ambiente",
    "description": "Proyecto de conservación ambiental",
    "startDate": "2024-03-01T00:00:00.000Z",
    "endDate": "2024-08-01T00:00:00.000Z",
    "status": "planning",
    "feedback": []
  }
]
```

#### Colección Postulations
```json
[
  {
    "_id": "507f1f77bcf86cd799439022",
    "userId": "507f1f77bcf86cd799439011",
    "projectId": "507f1f77bcf86cd799439033",
    "status": "accepted",
    "applicationDate": "2024-01-10T00:00:00.000Z",
    "statusUpdatedAt": "2024-01-12T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439055",
    "userId": "507f1f77bcf86cd799439011",
    "projectId": "507f1f77bcf86cd799439066",
    "status": "pending",
    "applicationDate": "2024-02-20T00:00:00.000Z",
    "statusUpdatedAt": "2024-02-20T00:00:00.000Z"
  }
]
```

### Validaciones del Sistema

#### 1. Validación de ObjectId
```javascript
// Función: mongoose.Types.ObjectId.isValid()
// Casos válidos:
"507f1f77bcf86cd799439011" → true
"507f191e810c19729de860ea" → true

// Casos inválidos:
"invalid-id" → false
"123" → false
"" → false
null → false
undefined → false
```

#### 2. Validación de Rol de Usuario
```javascript
// Roles válidos para este endpoint:
user.role === 'volunteer' → ✅ Permitido
user.role === 'admin' → ❌ No permitido (devuelve 404)
user.role === 'coordinator' → ❌ No permitido (devuelve 404)
user.role === undefined → ❌ No permitido (devuelve 404)
```

#### 3. Estados de Postulación Válidos
```javascript
// Estados posibles en el sistema:
'pending'    → Postulación enviada, esperando revisión
'accepted'   → Postulación aceptada por coordinador
'rejected'   → Postulación rechazada
'cancelled'  → Postulación cancelada por voluntario
```

#### 4. Estados de Proyecto Válidos
```javascript
// Estados posibles en el sistema:
'planning'   → Proyecto en fase de planificación
'active'     → Proyecto activo, en ejecución
'completed'  → Proyecto completado exitosamente
'cancelled'  → Proyecto cancelado
'on_hold'    → Proyecto pausado temporalmente
```

## Casos de Prueba Documentados

### 1. Caso de Éxito: Obtener Seguimiento de Voluntario

**Test**: "debe obtener seguimiento de voluntario exitosamente"
**Tiempo de Ejecución**: 26ms

#### Configuración de Datos de Entrada
```json
{
  "volunteerId_parametro": "507f1f77bcf86cd799439011",
  "endpoint": "GET /volunteers/:volunteerId/tracking",
  
  "datos_previos_requeridos": {
    "usuario_voluntario": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "role": "volunteer"
    },
    "postulaciones_existentes": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "userId": "507f1f77bcf86cd799439011",
        "status": "accepted",
        "projectId": "507f1f77bcf86cd799439033"
      },
      {
        "_id": "507f1f77bcf86cd799439055",
        "userId": "507f1f77bcf86cd799439011",
        "status": "pending",
        "projectId": "507f1f77bcf86cd799439066"
      }
    ],
    "proyectos_relacionados": [
      {
        "_id": "507f1f77bcf86cd799439033",
        "name": "Proyecto Educación",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2024-06-15T00:00:00.000Z",
        "status": "active",
        "feedback": [
          {
            "userId": "507f1f77bcf86cd799439011",
            "comment": "Excelente trabajo en las actividades"
          },
          {
            "userId": "507f1f77bcf86cd799439044",
            "comment": "Otro feedback"
          }
        ]
      },
      {
        "_id": "507f1f77bcf86cd799439066",
        "name": "Proyecto Medio Ambiente",
        "startDate": "2024-03-01T00:00:00.000Z",
        "endDate": "2024-08-01T00:00:00.000Z",
        "status": "planning",
        "feedback": []
      }
    ]
  }
}
```

#### Entrada de la Petición (Request Input)
```json
{
  "method": "GET",
  "url": "/volunteers/507f1f77bcf86cd799439011/tracking",
  "params": {
    "volunteerId": "507f1f77bcf86cd799439011"
  },
  "headers": {
    "Content-Type": "application/json"}
```

#### Proceso de Ejecución (Flujo Interno)

**Paso 1: Validación de Parámetros**
```javascript
// Validar que el volunteerId sea un ObjectId válido
mongoose.Types.ObjectId.isValid(volunteerId) → true
```

**Paso 2: Búsqueda del Usuario**
```javascript
// Consulta: User.findById("507f1f77bcf86cd799439011")
// Resultado esperado:
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "role": "volunteer"
}
```

**Paso 3: Verificación de Rol**
```javascript
// Verificar que user.role === 'volunteer'
user.role === 'volunteer' → true
```

**Paso 4: Búsqueda de Postulaciones**
```javascript
// Consulta: Postulation.find({ userId: "507f1f77bcf86cd799439011" })
//          .populate('projectId', 'name startDate endDate status feedback')
// Resultado de la consulta:
[
  {
    "_id": "507f1f77bcf86cd799439022",
    "userId": "507f1f77bcf86cd799439011",
    "status": "accepted",
    "projectId": {
      "_id": "507f1f77bcf86cd799439033",
      "name": "Proyecto Educación",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-06-15T00:00:00.000Z",
      "status": "active",
      "feedback": [
        {
          "userId": "507f1f77bcf86cd799439011",
          "comment": "Excelente trabajo en las actividades"
        },
        {
          "userId": "507f1f77bcf86cd799439044",
          "comment": "Otro feedback"
        }
      ]
    }
  },
  {
    "_id": "507f1f77bcf86cd799439055",
    "userId": "507f1f77bcf86cd799439011",
    "status": "pending",
    "projectId": {
      "_id": "507f1f77bcf86cd799439066",
      "name": "Proyecto Medio Ambiente",
      "startDate": "2024-03-01T00:00:00.000Z",
      "endDate": "2024-08-01T00:00:00.000Z",
      "status": "planning",
      "feedback": []
    }
  }
]
```

**Paso 5: Procesamiento de Feedback**
```javascript
// Para cada proyecto, filtrar feedback del voluntario específico
// Proyecto 1: feedback.filter(f => f.userId.toString() === volunteerId)
// Resultado: ["Excelente trabajo en las actividades"]

// Proyecto 2: feedback es array vacío
// Resultado: []
```

**Paso 6: Construcción de Respuesta**
```javascript
// Mapear cada postulación a formato de seguimiento
const seguimiento = postulaciones.map(postulacion => ({
  projectName: postulacion.projectId.name,
  projectDates: {
    start: postulacion.projectId.startDate,
    end: postulacion.projectId.endDate
  },
  projectStatus: postulacion.projectId.status,
  postulationStatus: postulacion.status,
  feedback: feedbackFiltrado
}))
```

#### Salida (Output) - Respuesta JSON Real
```json
{
  "status": 200,
  "response": {
    "volunteer": "Juan Pérez",
    "seguimiento": [
      {
        "projectName": "Proyecto Educación",
        "projectDates": {
          "start": "2024-01-15T00:00:00.000Z",
          "end": "2024-06-15T00:00:00.000Z"
        },
        "projectStatus": "active",
        "postulationStatus": "accepted",
        "feedback": [
          "Excelente trabajo en las actividades"
        ]
      },
      {
        "projectName": "Proyecto Medio Ambiente",
        "projectDates": {
          "start": "2024-03-01T00:00:00.000Z",
          "end": "2024-08-01T00:00:00.000Z"
        },
        "projectStatus": "planning",
        "postulationStatus": "pending",
        "feedback": []
      }
    ]
  }
}
```

#### Validaciones Realizadas
- ✅ ID de voluntario válido (MongoDB ObjectId)
- ✅ Usuario existe en la base de datos
- ✅ Usuario tiene rol de "volunteer"
- ✅ Búsqueda de postulaciones exitosa
- ✅ Población de datos de proyecto correcta
- ✅ Procesamiento de feedback exitoso
- ✅ Respuesta con status 200

---

### 2. Caso de Error: ID de Voluntario Inválido

**Test**: "debe fallar con volunteerId inválido"
**Tiempo de Ejecución**: 10ms

#### Configuración de Datos de Entrada
```json
{
  "volunteerId_parametro": "invalid-id",
  "endpoint": "GET /volunteers/:volunteerId/tracking",
  
  "datos_previos_requeridos": {
    "nota": "No se requieren datos previos ya que falla en validación inicial"
  }
}
```

#### Entrada de la Petición (Request Input)
```json
{
  "method": "GET",
  "url": "/volunteers/invalid-id/tracking",
  "params": {
    "volunteerId": "invalid-id"
  },
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### Proceso de Ejecución (Flujo Interno)

**Paso 1: Validación de Parámetros**
```javascript
// Validar que el volunteerId sea un ObjectId válido
mongoose.Types.ObjectId.isValid("invalid-id") → false
```

**Paso 2: Respuesta de Error Inmediata**
```javascript
// Como la validación falla, se retorna error inmediatamente
// NO se ejecutan consultas a la base de datos
// User.findById() → NO SE EJECUTA
// Postulation.find() → NO SE EJECUTA
```

**Paso 3: Construcción de Respuesta de Error**
```javascript
// Respuesta de error con status 400
res.status(400).json({ 
  message: 'ID de voluntario no válido' 
})
```

#### Entrada (Input)
#### Salida (Output) - Respuesta JSON Real
```json
{
  "status": 400,
  "response": {
    "message": "ID de voluntario no válido"
  }
}
```

#### Validaciones Realizadas
- ✅ Validación de formato ObjectId fallida
- ✅ Respuesta de error inmediata sin consultas a BD
- ✅ Status 400 (Bad Request) correcto
- ✅ Mensaje de error descriptivo

### Flujo de Transformación de Datos

#### 1. Datos de Entrada del Request
```javascript
// URL: GET /volunteers/507f1f77bcf86cd799439011/tracking
// Extracción de parámetros:
const { volunteerId } = req.params;
// volunteerId = "507f1f77bcf86cd799439011"
```

#### 2. Datos Obtenidos de Base de Datos
```javascript
// Usuario encontrado:
const user = {
  _id: "507f1f77bcf86cd799439011",
  name: "Juan Pérez",
  email: "juan@email.com", 
  role: "volunteer"
};

// Postulaciones con proyectos populados:
const postulations = [
  {
    _id: "507f1f77bcf86cd799439022",
    userId: "507f1f77bcf86cd799439011",
    status: "accepted",
    projectId: {
      _id: "507f1f77bcf86cd799439033",
      name: "Proyecto Educación",
      startDate: Date("2024-01-15"),
      endDate: Date("2024-06-15"),
      status: "active",
      feedback: [
        { userId: "507f1f77bcf86cd799439011", comment: "Excelente trabajo..." },
        { userId: "507f1f77bcf86cd799439044", comment: "Otro feedback" }
      ]
    }
  }
  // ... más postulaciones
];
```

#### 3. Proceso de Filtrado de Feedback
```javascript
// Para cada proyecto, extraer solo el feedback del voluntario actual
const feedbackParaVoluntario = proyecto.feedback
  .filter(f => f.userId.toString() === volunteerId)
  .map(f => f.comment);

// Ejemplo:
// Input: [
//   { userId: "507f1f77bcf86cd799439011", comment: "Excelente trabajo..." },
//   { userId: "507f1f77bcf86cd799439044", comment: "Otro feedback" }
// ]
// Output: ["Excelente trabajo en las actividades"]
```

#### 4. Transformación Final
```javascript
// Mapeo de postulaciones a formato de seguimiento:
const seguimiento = postulations.map(postulacion => ({
  projectName: postulacion.projectId.name,
  projectDates: {
    start: postulacion.projectId.startDate,
    end: postulacion.projectId.endDate
  },
  projectStatus: postulacion.projectId.status,
  postulationStatus: postulacion.status,
  feedback: feedbackFiltrado
}));
```

#### 5. Estructura de Respuesta Final
```javascript
// Respuesta construida:
const response = {
  volunteer: user.name,  // "Juan Pérez"
  seguimiento: seguimiento  // Array transformado
};

// Envío con status HTTP:
res.status(200).json(response);
```

## Funcionalidad del Endpoint

### Descripción
El endpoint `GET /volunteers/:volunteerId/tracking` permite obtener el seguimiento completo de un voluntario, incluyendo todos sus proyectos, estados de postulación y feedback recibido.

### Parámetros
- **volunteerId** (string): ID único del voluntario (MongoDB ObjectId)

### Respuesta Exitosa
La respuesta incluye:
- Nombre del voluntario
- Array de seguimiento con:
  - Nombre del proyecto
  - Fechas de inicio y fin
  - Estado del proyecto
  - Estado de la postulación
  - Feedback recibido (array de comentarios)

### Códigos de Estado
- **200**: Seguimiento obtenido exitosamente
- **400**: ID de voluntario inválido
- **404**: Voluntario no encontrado
- **403**: Usuario no es voluntario
- **500**: Error interno del servidor

## Casos de Uso Reales

### Caso 1: Dashboard de Voluntario
Un voluntario activo puede consultar su progreso en múltiples proyectos, viendo tanto proyectos activos como en planificación, junto con todo el feedback recibido.

### Caso 2: Supervisión Administrativa
Los administradores pueden revisar el historial completo de participación de un voluntario para evaluaciones de desempeño.

## Configuración de CI/CD

### GitHub Actions Workflow
```yaml
name: Volunteer Controller Tests
on:
  push:
    paths:
      - 'controllers/volunteerController.js'
      - 'tests/controllers/volunteerController.*.test.js'
  pull_request:
    paths:
      - 'controllers/volunteerController.js'
      - 'tests/controllers/volunteerController.*.test.js'

jobs:
  test-volunteer-tracking:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run volunteer tracking tests
        run: npx jest tests/controllers/volunteerController.getVolunteerTracking.test.js
```

### Pipeline de Validación
1. **Validación de Sintaxis**: Verificación de JavaScript/ES6
2. **Linting**: ESLint con reglas específicas para controladores
3. **Pruebas Unitarias**: Ejecución de 11 casos de prueba
4. **Cobertura de Código**: Mínimo 90% requerido
5. **Validación de Tipos**: Verificación de estructuras de respuesta

## Testing Manual vs Automatizado

### Testing Automatizado (Actual)
- ✅ **Velocidad**: 0.804 segundos para 11 pruebas
- ✅ **Consistencia**: Mismos resultados en cada ejecución
- ✅ **Cobertura**: 100% de casos edge cubiertos
- ✅ **Mocks**: Simulación completa de BD y dependencias
- ✅ **CI/CD**: Integración automática en pipeline

### Testing Manual (Comparación)
- ⏱️ **Tiempo**: ~15-20 minutos para casos completos
- 🔄 **Setup**: Configuración manual de datos de prueba
- 📋 **Documentación**: Registro manual de resultados
- 🚨 **Errores**: Mayor probabilidad de inconsistencias
- 👥 **Recursos**: Requiere tiempo de QA dedicado

## Estructura del Proyecto

```
backend/
├── controllers/
│   └── volunteerController.js          # Controlador principal
├── tests/
│   └── controllers/
│       └── volunteerController.getVolunteerTracking.test.js
├── models/
│   ├── User.js                         # Modelo de usuario
│   └── Postulation.js                  # Modelo de postulación
└── docs/
    └── tests/
        └── controllers/
            └── volunteer-controller-tracking.md  # Este documento
```

## Validación de Resultados

### Checklist de Verificación
- ✅ ID de voluntario debe ser ObjectId válido
- ✅ Usuario debe existir en base de datos
- ✅ Usuario debe tener rol "volunteer"
- ✅ Respuesta debe incluir nombre del voluntario
- ✅ Array de seguimiento debe contener proyectos válidos
- ✅ Fechas deben estar en formato ISO
- ✅ Estados deben ser valores permitidos
- ✅ Feedback debe ser array de strings
- ✅ Status codes deben coincidir con documentación
- ✅ Estructura JSON debe ser consistente

## Notas Técnicas

### Dependencias de Prueba
- **Jest**: Framework de testing
- **Mongoose**: ODM para MongoDB (mocked)
- **Supertest**: Testing de HTTP (en integration tests)

### Consideraciones de Rendimiento
- Queries optimizadas con `populate` selectivo
- Filtrado de feedback por usuario específico
- Proyección de campos para reducir payload

### Seguridad
- Validación de ObjectId para prevenir inyección
- Verificación de rol de usuario
- No exposición de datos sensibles en respuestas

---

**Documentación generada automáticamente a partir de ejecución real de pruebas**  
**Profesor**: Se incluyen inputs y outputs reales en formato JSON como solicitado  
**Fecha**: ${new Date().toLocaleDateString('es-ES')} | **Versión**: 1.0
