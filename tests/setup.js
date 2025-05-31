// Setup global para todas las pruebas
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Configurar variables de entorno para testing si no están definidas
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/test-db';
}

// Mock para console.error para evitar ruido en las pruebas
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Configuración global de timeout para pruebas
jest.setTimeout(10000);
