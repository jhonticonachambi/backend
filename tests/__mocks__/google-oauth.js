// Mock para Google OAuth y servicios relacionados
// Este archivo mockea las integraciones con Google para evitar errores en CI

// Mock de passport-google-oauth20 solo si el módulo existe
try {
  require.resolve('passport-google-oauth20');
  jest.mock('passport-google-oauth20', () => ({
    Strategy: jest.fn().mockImplementation((options, callback) => {
      // Mock del constructor de GoogleStrategy
      return {
        name: 'google',
        authenticate: jest.fn((req, options) => {
          // Mock de la función de autenticación
          const profile = {
            id: 'mock-google-id',
            displayName: 'Test User',
            emails: [{ value: 'test@example.com' }]
          };
          
          // Llamar al callback con el perfil mock
          callback('mock-access-token', 'mock-refresh-token', profile, (err, user) => {
            if (err) return req.authInfo = { error: err };
            req.user = user || { id: 'mock-user-id', name: 'Test User', email: 'test@example.com' };
          });
        })
      };
    })
  }));
} catch (e) {
  // passport-google-oauth20 no está instalado, no hacer nada
}

// Mock de googleapis solo si el módulo existe
try {
  require.resolve('googleapis');
  jest.mock('googleapis', () => ({
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
          getRequestHeaders: jest.fn().mockResolvedValue({}),
          getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
        }))
      },
      sheets: jest.fn().mockImplementation(() => ({
        spreadsheets: {
          values: {
            get: jest.fn().mockResolvedValue({ data: { values: [] } }),
            update: jest.fn().mockResolvedValue({ data: {} })
          }
        }
      })),
      drive: jest.fn().mockImplementation(() => ({
        files: {
          list: jest.fn().mockResolvedValue({ data: { files: [] } }),
          create: jest.fn().mockResolvedValue({ data: { id: 'mock-file-id' } })
        }
      }))
    }
  }));
} catch (e) {
  // googleapis no está instalado, no hacer nada
}

// Mock de passport si es necesario
jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  authenticate: jest.fn((strategy, options) => (req, res, next) => {
    req.user = { id: 'mock-user-id', name: 'Test User', email: 'test@example.com' };
    next();
  }),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
}));

module.exports = {};
