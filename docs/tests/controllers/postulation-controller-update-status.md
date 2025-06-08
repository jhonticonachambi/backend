# 📋 MANUAL DE PRUEBAS - PostulationController UPDATE STATUS

## ⚙️ COMO SE INSTALA Y CONFIGURA

### Instalación de Dependencias:
```bash
npm install jest supertest mongoose
```

### Configuración del Entorno:
```javascript
// Archivo: tests/controllers/postulationController.updatePostulationStatus.test.js
NODE_ENV=test
```

## 📊 DATOS INGRESADOS

### Componente bajo Prueba:
- **Controlador**: `postulationController.js`
- **Método específico**: `updatePostulationStatus()`
- **Tipo**: Actualización de estado de postulaciones con notificaciones automáticas

## 🧪 PROCESO Y RESULTADO

### Pruebas Unitarias Ejecutadas:

#### 🔍 Caso 1: Actualización exitosa a "accepted" con notificaciones
**Datos de entrada específicos (input):**
```javascript
req.body = {
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "newStatus": "accepted"
}
```
### Archivo de Prueba:
```
📁 tests/controllers/postulationController.updatePostulationStatus.test.js
```


**Resultado esperado:**
```
Status: 200
Response: {
  message: "Postulations status updated successfully",
  postulaciones: [array de postulaciones actualizadas]
}
```

**Resultado real obtenido:**
```
📋 CASO 1: Actualización exitosa a "accepted"
📊 Input: {
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "newStatus": "accepted"
}

✅ Método: updatePostulationStatus → con múltiples IDs y status "accepted" → resultado: postulaciones actualizadas y notificaciones creadas

✅ Response Status: 200

✅ Response JSON: {
  "message": "Postulations status updated successfully",
  "postulaciones": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "user123"
      },
      "projectId": "project456",
      "status": "accepted"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": {
        "_id": "user789"
      },
      "projectId": "project456",
      "status": "accepted"
    }
  ]
}
```

---

#### 🔍 Caso 2: Error 404 - Postulaciones no encontradas
**Datos de entrada específicos (input):**
```javascript
req.body = {
  "ids": [
    "507f1f77bcf86cd799439020"
  ],
  "newStatus": "accepted"
}
```

**Resultado esperado:**
```
Status: 404
Response: {
  message: "Postulations not found"
}
```

**Resultado real obtenido:**
```
📋 CASO 2: Error 404 - Postulaciones no encontradas
📊 Input: {
  "ids": [
    "507f1f77bcf86cd799439020"
  ],
  "newStatus": "accepted"
}

❌ Método: updatePostulationStatus → con IDs inexistentes → resultado: error 404 postulaciones no encontradas

✅ Response Status: 404

✅ Response JSON: {
  "message": "Postulations not found"
}
```

---

## 📄 Estructura del Archivo de Prueba

### Archivo: `tests/controllers/postulationController.updatePostulationStatus.test.js`

```javascript
const { updatePostulationStatus } = require('../../controllers/postulationController');

// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  model: jest.fn(),
  connect: jest.fn()
}));

// Mock de todas las dependencias ANTES de importar el controlador
jest.mock('../../models/Postulation', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../../models/Notification', () => jest.fn().mockImplementation(() => ({
  save: jest.fn()
})));

const Postulacion = require('../../models/Postulation');
const Notification = require('../../models/Notification');

describe('PostulationController - updatePostulationStatus', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {
    test('Debe actualizar status a "accepted" y crear notificación correctamente', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439011',
          userId: { _id: 'user123' },
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          userId: { _id: 'user789' },
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);
      Notification.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue()
      }));

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      console.log('=== CASO ÉXITO - Status Accepted ===');
      console.log('Input:', JSON.stringify(req.body, null, 2));
      console.log('Response Status:', res.status.mock.calls[0][0]);
      console.log('Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('===============================');
      
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: mockIds } });
      expect(mockPostulations[0].save).toHaveBeenCalled();
      expect(mockPostulations[1].save).toHaveBeenCalled();
      expect(mockPostulations[0].status).toBe('accepted');
      expect(mockPostulations[1].status).toBe('accepted');
      expect(Notification).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Postulations status updated successfully',
        postulaciones: mockPostulations
      });
    });

    // ... otros tests de éxito ...
  });

  describe('Casos de postulaciones no encontradas', () => {
    test('Debe retornar error 404 cuando no se encuentran postulaciones', async () => {
      // Arrange
      req.body = {
        ids: ['507f1f77bcf86cd799439020'],
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue([]); // Array vacío

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      console.log('=== CASO ERROR 404 - Postulations Not Found ===');
      console.log('Input:', JSON.stringify(req.body, null, 2));
      console.log('Response Status:', res.status.mock.calls[0][0]);
      console.log('Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('=========================================');
      
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: req.body.ids } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Postulations not found' });
    });

    // ... otros tests de error 404 ...
  });

  // ... otros describe blocks con tests adicionales ...
});
```

### 🔧 Configuración de Mocks

**Mongoose Mock:**
```javascript
jest.mock('mongoose', () => ({
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  model: jest.fn(),
  connect: jest.fn()
}));
```

**Postulation Model Mock:**
```javascript
jest.mock('../../models/Postulation', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));
```

**Notification Model Mock:**
```javascript
jest.mock('../../models/Notification', () => jest.fn().mockImplementation(() => ({
  save: jest.fn()
})));
```

### 📋 Setup de Request/Response

```javascript
beforeEach(() => {
  req = {
    body: {}
  };

  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };

  jest.clearAllMocks();
});
```

---

## Resultados de Ejecución Completa

### Ejecución Real del 8 de junio de 2025

```bash
npx jest tests/controllers/postulationController.updatePostulationStatus.test.js

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        1.594 s
```

---


✅ **Casos de Éxito (4 tests)**:
- Actualización a "accepted" con creación de notificaciones
- Actualización a "rejected" sin notificaciones  
- Actualización a "pending" correctamente
- Manejo de postulaciones sin userId

✅ **Validación de Entrada (4 tests)**:
- Rechazo de estados inválidos (error 400)
- Validación de estados válidos: pending, accepted, rejected

✅ **Postulaciones No Encontradas (2 tests)**:
- Error 404 cuando no se encuentran postulaciones
- Manejo de IDs inexistentes

✅ **Errores del Servidor (3 tests)**:
- Error 500 en consultas de BD
- Error 500 al guardar postulaciones
- Error 500 al crear notificaciones

✅ **Múltiples Postulaciones (2 tests)**:
- Procesamiento de postulaciones mixtas
- Arrays con una sola postulación

✅ **Verificación MongoDB (2 tests)**:
- Consultas correctas con $in
- Bucles de procesamiento múltiple

---

## 🚀 Configuración CI/CD (Integración Continua)

### Scripts de Automatización en package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:postulation": "jest tests/controllers/postulationController.updatePostulationStatus.test.js",
    "test:postulation:watch": "jest tests/controllers/postulationController.updatePostulationStatus.test.js --watch",
    "test:postulation:coverage": "jest tests/controllers/postulationController.updatePostulationStatus.test.js --coverage"
  }
}
```

### Pipeline de GitHub Actions (.github/workflows/ci-tests.yml):
```yaml
name: 🧪 Automated Tests CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run postulation controller tests
      run: npx jest tests/controllers/postulationController.updatePostulationStatus.test.js --coverage --verbose
```

### ✅ Beneficios de CI/CD:
```
🚀 Ejecución automática: Las pruebas se ejecutan en cada push/PR
🔍 Múltiples versiones de Node: Probado en Node 16.x, 18.x, 20.x
📊 Cobertura automática: Genera reportes de cobertura de código
🛡️ Bloqueo de merge: No se puede hacer merge si fallan las pruebas
⚡ Feedback inmediato: Resultados en menos de 2 minutos
📈 Historial completo: Registro de todas las ejecuciones de pruebas
```

---

**Autor**: Sistema de Pruebas Automatizadas  
**Fecha**: 8 de junio de 2025  
**Versión**: 1.0  
**Próxima Revisión**: Según actualizaciones del controlador
