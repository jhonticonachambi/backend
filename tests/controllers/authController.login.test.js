const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

// Mock de las dependencias ANTES de importar el controlador
jest.mock('../../models/User', () => {
  const mockUser = jest.fn();
  mockUser.findOne = jest.fn();
  return mockUser;
});

jest.mock('jsonwebtoken');
jest.mock('speakeasy');

// Importar después de los mocks
const { login } = require('../../controllers/authController');
const User = require('../../models/User');

// Mock del crypto usando el mismo algoritmo que el controlador
const mockGenerateHash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Mock del User constructor
User.mockImplementation(function(userData) {
  Object.assign(this, userData);
  this._id = 'mock-user-id';
  this.save = jest.fn().mockResolvedValue();
  return this;
});

describe('AuthController - Login', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {
        email: 'juan@example.com',
        password: 'password123',
        token: '123456' // Token de 2FA
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();
    
    // Restaurar el mock del User al estado original
    User.mockImplementation(function(userData) {
      Object.assign(this, userData);
      this._id = 'mock-user-id';
      this.save = jest.fn().mockResolvedValue();
      return this;
    });
  });

  describe('Casos de éxito', () => {
    test('Debe hacer login correctamente con credenciales válidas (sin 2FA)', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        name: mockUser.name,
        role: mockUser.role,
        id: mockUser._id
      });
    });

    test('Debe hacer login correctamente con 2FA válido', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret-2fa'
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');
      speakeasy.totp.verify.mockReturnValue(true);      // Act
      await login(req, res);

      // Assert
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: mockUser.twoFactorSecret,
        encoding: 'base32',
        token: req.body.token
      });
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        name: mockUser.name,
        role: mockUser.role,
        id: mockUser._id
      });
    });

    test('Debe retornar todos los datos del usuario en la respuesta', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'María García',
        email: 'maria@example.com',
        password: mockGenerateHash('password123'),
        role: 'admin',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        name: 'María García',
        role: 'admin',
        id: 'user-id-123'
      });
    });
  });

  describe('Casos de error - Usuario no encontrado', () => {
    test('Debe retornar error 400 si el usuario no existe', async () => {
      // Arrange
      User.findOne.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error - Contraseña incorrecta', () => {
    test('Debe retornar error 400 si la contraseña es incorrecta', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password-diferente'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña incorrecta' });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test('Debe comparar contraseñas usando hash SHA-256', async () => {
      // Arrange
      const plainPassword = 'mi-password-secreto';
      const hashedPassword = mockGenerateHash(plainPassword);
      
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: hashedPassword,
        role: 'volunteer',
        twoFactorEnabled: false
      };

      req.body.password = plainPassword;
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        name: mockUser.name,
        role: mockUser.role,
        id: mockUser._id
      });
    });
  });

  describe('Casos de error - 2FA', () => {
    test('Debe retornar error 400 si el código 2FA es inválido', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret-2fa'
      };

      User.findOne.mockResolvedValue(mockUser);
      speakeasy.totp.verify.mockReturnValue(false); // Token 2FA inválido      // Act
      await login(req, res);

      // Assert
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: mockUser.twoFactorSecret,
        encoding: 'base32',
        token: req.body.token
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Código de 2FA inválido' });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test('Debe verificar 2FA solo si está habilitado', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false // 2FA deshabilitado
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      expect(speakeasy.totp.verify).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        name: mockUser.name,
        role: mockUser.role,
        id: mockUser._id
      });
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la base de datos', async () => {
      // Arrange
      User.findOne.mockRejectedValue(new Error('Database connection error'));

      // Spy en console.log para verificar que se registra el error
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });
      expect(consoleSpy).toHaveBeenCalledWith('Error en el servidor:', expect.any(Error));

      // Limpiar spy
      consoleSpy.mockRestore();
    });

    test('Debe retornar error 500 si falla la generación del token', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT generation error');
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });

      consoleSpy.mockRestore();
    });
  });

  describe('Verificación de logging', () => {
    test('Debe registrar intento de inicio de sesión', async () => {
      // Arrange
      User.findOne.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await login(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Intento de inicio de sesión con email:', req.body.email);

      consoleSpy.mockRestore();
    });

    test('Debe registrar contraseñas para debugging', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await login(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Contraseña almacenada (cifrada) en la base de datos:', mockUser.password);
      expect(consoleSpy).toHaveBeenCalledWith('Contraseña ingresada:', req.body.password);
      expect(consoleSpy).toHaveBeenCalledWith('Contraseña ingresada cifrada:', mockGenerateHash(req.body.password));
      expect(consoleSpy).toHaveBeenCalledWith('Inicio de sesión exitoso, token generado:', 'fake-jwt-token');

      consoleSpy.mockRestore();
    });
  });

  describe('Verificación de estructura de respuesta', () => {
    test('Debe incluir todos los campos requeridos en la respuesta exitosa', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('token');
      expect(responseCall).toHaveProperty('name');
      expect(responseCall).toHaveProperty('role');
      expect(responseCall).toHaveProperty('id');
      expect(Object.keys(responseCall)).toHaveLength(4);
    });

    test('Debe generar token JWT con el formato correcto', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer',
        twoFactorEnabled: false
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
  });
});
