// Setup global para todas las pruebas
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

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
