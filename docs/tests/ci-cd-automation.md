# Manual de Configuración CI/CD - Pruebas Automatizadas

## Información General

### Descripción del Sistema
Este manual documenta la configuración completa del sistema de Integración Continua y Despliegue Continuo (CI/CD) para la automatización de pruebas del backend API. El sistema está diseñado para ejecutar automáticamente todas las pruebas cuando se realizan cambios en el código, garantizando la calidad y estabilidad del software.

### Arquitectura del Sistema de Pruebas
```
CI/CD Pipeline
├── GitHub Actions (Orquestador principal)
├── Jest Test Runner (Ejecutor de pruebas)
├── Coverage Reports (Informes de cobertura)
├── Artifact Storage (Almacenamiento de reportes)
```

### Estadísticas del Proyecto
- **Total de Pruebas**: 87 casos de prueba
- **Tiempo de Ejecución**: ~15-20 segundos
- **Cobertura de Código**: 92% objetivo
- **Tipos de Prueba**: Unitarias, Integración, E2E

## Configuración de GitHub Actions

### 1. Workflow Principal

**Archivo**: `.github/workflows/ci.yml`

```yaml
name: Continuous Integration Pipeline

on:
  push:
    branches: [ main, develop, 'feature/*', 'hotfix/*' ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18.x'
  MONGODB_URI: 'mongodb://localhost:27017/test'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
        options: >-
          --health-cmd mongo
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci
          npm audit --audit-level moderate

      - name: Environment Setup
        run: |
          cp .env.example .env.test
          echo "NODE_ENV=test" >> .env.test
          echo "MONGODB_URI=${{ env.MONGODB_URI }}" >> .env.test

      - name: Lint Code
        run: |
          npm run lint
          npm run lint:fix

      - name: Run Unit Tests
        run: |
          npm run test:unit -- --coverage --ci --watchAll=false
        env:
          NODE_ENV: test

      - name: Run Integration Tests
        run: |
          npm run test:integration -- --ci --watchAll=false
        env:
          NODE_ENV: test

      - name: Run E2E Tests
        run: |
          npm run test:e2e -- --ci --watchAll=false
        env:
          NODE_ENV: test

      - name: Generate Test Reports
        run: |
          npm run test:report
          npm run coverage:report

      - name: Upload Coverage Reports
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Upload Test Artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            test-report.html
            coverage/
            logs/

      - name: Comment PR with Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = './test-report.html';
            if (fs.existsSync(path)) {
              const content = fs.readFileSync(path, 'utf8');
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: '## 🧪 Test Results\n\nPruebas ejecutadas correctamente. Ver artefactos para detalles completos.'
              });
            }
```

### 2. Workflow de Seguridad

**Archivo**: `.github/workflows/security.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Lunes a las 2 AM

jobs:
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'

      - name: Install Dependencies
        run: npm ci

      - name: Run Security Audit
        run: |
          npm audit --audit-level moderate
          npx audit-ci --moderate

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium
```

### 3. Workflow de Despliegue

**Archivo**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    name: Deploy Application
    runs-on: ubuntu-latest
    needs: [test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'

      - name: Install Dependencies
        run: npm ci --only=production

      - name: Build Application
        run: npm run build

      - name: Deploy to Server
        run: |
          echo "Deploying to production server..."
          # Aquí irían los comandos de despliegue específicos
```

## Configuración de package.json

### Scripts de Testing

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test jest",
    "test:unit": "cross-env NODE_ENV=test jest tests/controllers tests/models",
    "test:integration": "cross-env NODE_ENV=test jest tests/integration",
    "test:e2e": "cross-env NODE_ENV=test jest tests/e2e",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage",
    "test:report": "cross-env NODE_ENV=test jest --reporters=default --reporters=jest-html-reporter",
    "coverage:report": "nyc report --reporter=html --reporter=text",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "audit:security": "npm audit --audit-level moderate",
    "audit:fix": "npm audit fix"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "controllers/**/*.js",
      "models/**/*.js",
      "middleware/**/*.js",
      "utils/**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 85,
        "lines": 90,
        "statements": 90
      }
    },
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/coverage/"
    ],
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
```

## Configuración de Jest

### Archivo de Configuración Principal

**Archivo**: `jest.config.js`

```javascript
module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Archivos de configuración inicial
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Patrón de archivos de prueba
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Configuración de cobertura
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    // Umbrales específicos por archivo
    './controllers/': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    }
  },
  
  // Reportes de cobertura
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Directorio de reportes
  coverageDirectory: 'coverage',
  
  // Reportes de pruebas
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Test Report - Backend API',
      outputPath: 'test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  
  // Configuración de timeouts
  testTimeout: 30000,
  
  // Variables de entorno
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Transformaciones
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Archivos de mock globales
  globalSetup: '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/teardown.js'
};
```

### Archivo de Setup Global

**Archivo**: `tests/setup.js`

```javascript
const mongoose = require('mongoose');

// Configuración global para todas las pruebas
beforeAll(async () => {
  // Configurar variables de entorno
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  
  // Configurar timeouts
  jest.setTimeout(30000);
  
  // Conectar a base de datos de prueba
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
});

// Limpiar después de cada prueba
afterEach(async () => {
  // Limpiar mocks
  jest.clearAllMocks();
  
  // Opcional: limpiar colecciones de BD
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Cerrar conexiones al final
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

// Configuración global de mocks
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' }))
  }))
}));

// Suprimir logs durante las pruebas
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
```

## Configuración de Herramientas de Calidad

### ESLint Configuration

**Archivo**: `.eslintrc.js`

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

### Prettier Configuration

**Archivo**: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## Configuración de Base de Datos para Testing

### Docker Compose para Testing

**Archivo**: `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  mongodb-test:
    image: mongo:latest
    container_name: mongodb-test
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: test
    volumes:
      - mongodb-test-data:/data/db
    command: mongod --quiet --logpath /dev/null

  redis-test:
    image: redis:alpine
    container_name: redis-test
    ports:
      - "6379:6379"

volumes:
  mongodb-test-data:
```

### Scripts de Base de Datos

**Archivo**: `scripts/test-db-setup.js`

```javascript
const mongoose = require('mongoose');

async function setupTestDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Base de datos de prueba conectada');
    
    // Crear índices necesarios
    await createIndexes();
    
    // Insertar datos de prueba si es necesario
    await seedTestData();
    
  } catch (error) {
    console.error('❌ Error configurando BD de prueba:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  // Crear índices para optimizar queries de prueba
  const db = mongoose.connection.db;
  
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('projects').createIndex({ status: 1, startDate: 1 });
  await db.collection('postulations').createIndex({ userId: 1, projectId: 1 });
  
  console.log('📋 Índices de BD creados');
}

async function seedTestData() {
  // Datos mínimos para pruebas
  const testData = {
    users: [
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test User',
        email: 'test@example.com',
        role: 'volunteer'
      }
    ]
  };
  
  // Insertar solo si no existen
  for (const [collection, data] of Object.entries(testData)) {
    const count = await mongoose.connection.db.collection(collection).countDocuments();
    if (count === 0) {
      await mongoose.connection.db.collection(collection).insertMany(data);
      console.log(`📦 Datos de prueba insertados en ${collection}`);
    }
  }
}

module.exports = { setupTestDatabase };
```

## Monitoreo y Reportes

### Configuración de Coverage Reports

**Archivo**: `coverage.config.js`

```javascript
module.exports = {
  branches: 80,
  functions: 85,
  lines: 90,
  statements: 90,
  
  // Configuración de reportes
  reporters: [
    'text',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Archivos a incluir
  include: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js'
  ],
  
  // Archivos a excluir
  exclude: [
    'tests/**',
    'coverage/**',
    'node_modules/**'
  ]
};
```

### Webhook de Notificaciones

**Archivo**: `scripts/notify-results.js`

```javascript
const axios = require('axios');

async function notifyTestResults(results) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('🔕 No hay webhook configurado para notificaciones');
    return;
  }
  
  const message = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": results.success ? "28a745" : "dc3545",
    "summary": `Pruebas ${results.success ? 'Exitosas' : 'Fallidas'}`,
    "sections": [{
      "activityTitle": "🧪 Resultados de Pruebas Automatizadas",
      "activitySubtitle": `Branch: ${process.env.GITHUB_REF}`,
      "facts": [
        {
          "name": "Total Pruebas",
          "value": results.total
        },
        {
          "name": "Exitosas",
          "value": results.passed
        },
        {
          "name": "Fallidas",
          "value": results.failed
        },
        {
          "name": "Cobertura",
          "value": `${results.coverage}%`
        },
        {
          "name": "Tiempo",
          "value": results.duration
        }
      ]
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "Ver Detalles",
      "targets": [{
        "os": "default",
        "uri": `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      }]
    }]
  };
  
  try {
    await axios.post(webhookUrl, message);
    console.log('📧 Notificación enviada correctamente');
  } catch (error) {
    console.error('❌ Error enviando notificación:', error.message);
  }
}

module.exports = { notifyTestResults };
```

## Comandos de Ejecución

### Comandos Locales

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas específicas
npm run test:unit
npm run test:integration
npm run test:e2e

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Generar reportes
npm run test:report

# Linting
npm run lint
npm run lint:fix

# Auditoría de seguridad
npm run audit:security
```

### Comandos de CI/CD

```bash
# Setup de entorno de prueba
docker-compose -f docker-compose.test.yml up -d

# Ejecución completa de CI
npm ci
npm run lint
npm run test:coverage
npm run audit:security

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Estructura de Archivos CI/CD

```
.github/
├── workflows/
│   ├── ci.yml                    # Pipeline principal
│   ├── security.yml              # Análisis de seguridad
│   └── deploy.yml                # Despliegue automático
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
└── pull_request_template.md

scripts/
├── test-db-setup.js              # Configuración de BD
├── notify-results.js             # Notificaciones
└── deploy.sh                     # Script de despliegue

coverage/                         # Reportes de cobertura
├── html/
├── lcov.info
└── coverage-summary.json

test-reports/                     # Reportes de pruebas
├── test-report.html
├── junit.xml
└── coverage-report.html
```

## Variables de Entorno Requeridas

### GitHub Secrets

```bash
# Base de datos
MONGODB_URI=mongodb://localhost:27017/test
REDIS_URL=redis://localhost:6379

# Autenticación
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Notificaciones
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Análisis de seguridad
SNYK_TOKEN=your-snyk-token
CODECOV_TOKEN=your-codecov-token

# Despliegue
DEPLOY_SSH_KEY=your-deploy-ssh-key
SERVER_HOST=your-server-host
SERVER_USER=your-server-user
```

### Archivo .env.test

```bash
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/test
JWT_SECRET=test-jwt-secret
JWT_EXPIRES_IN=1h

# Test specific configurations
TEST_TIMEOUT=30000
SUPPRESS_LOGS=true
MOCK_EXTERNAL_SERVICES=true

# Coverage settings
COVERAGE_THRESHOLD=90
FAIL_ON_COVERAGE=true
```

## Validación y Verificación

### Checklist de Configuración

- ✅ GitHub Actions configurado correctamente
- ✅ Jest con configuración completa
- ✅ ESLint y Prettier configurados
- ✅ Base de datos de prueba funcional
- ✅ Scripts de CI/CD operativos
- ✅ Reportes de cobertura generándose
- ✅ Notificaciones configuradas
- ✅ Variables de entorno definidas
- ✅ Seguridad y auditoría activa
- ✅ Artefactos de prueba almacenándose

### Comandos de Verificación

```bash
# Verificar configuración de Jest
npx jest --showConfig

# Verificar ESLint
npx eslint --print-config .

# Verificar conectividad de BD
node -e "require('./scripts/test-db-setup').setupTestDatabase()"

# Verificar pipeline local
act -j test  # Requiere act CLI

# Verificar cobertura
npm run test:coverage && open coverage/index.html
```

---

**Documentación de CI/CD generada para automatización completa de pruebas**  
**Configuración**: Pipeline completo con GitHub Actions, Jest, y reportes  
**Fecha**: 8 de junio de 2025 | **Versión**: 1.0
