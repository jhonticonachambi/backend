const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock de las dependencias ANTES de importar el controlador
jest.mock('../../models/User', () => {
  const mockUser = jest.fn();
  mockUser.findOne = jest.fn();
  return mockUser;
});

jest.mock('jsonwebtoken');

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
        password: 'password123'
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
    test('Debe hacer login correctamente con credenciales válidas', async () => {
      // Arrange
      console.log('\n📋 CASO 1: Login exitoso');
      console.log('📊 Datos de entrada:', JSON.stringify(req.body, null, 2));
      
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer'
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await login(req, res);      // Assert
      const responseData = res.json.mock.calls[0][0];
      console.log(' Método: Login exitoso → con datos email="juan@example.com", password="password123" → resultado: token generado y datos del usuario');
      console.log(' Status esperado: 200');
      console.log(' Response obtenida:', JSON.stringify(responseData, null, 2));
      
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
    });    test('Debe retornar todos los datos del usuario en la respuesta', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'María García',
        email: 'maria@example.com',
        password: mockGenerateHash('password123'),
        role: 'admin'
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
      console.log('\n📋 CASO 2: Usuario no encontrado');
      console.log('📊 Datos de entrada:', JSON.stringify(req.body, null, 2));
        User.findOne.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      console.log('✅ Método: Usuario no encontrado → con datos email="juan@example.com", password="password123" → resultado: error 400 "Usuario no encontrado"');
      console.log('✅ Status esperado: 400');
      console.log('✅ Response esperada: {message: "Usuario no encontrado"}');
      console.log('✅ Status obtenido:', res.status.mock.calls[0][0]);
      console.log('✅ Response obtenida:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      
      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
  describe('Casos de error - Contraseña incorrecta', () => {
    test('Debe retornar error 400 si la contraseña es incorrecta', async () => {
      // Arrange
      console.log('\n📋 CASO 3: Contraseña incorrecta');
      console.log('📊 Datos de entrada:', JSON.stringify(req.body, null, 2));
      
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password-diferente'),
        role: 'volunteer'
      };

      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      console.log('✅ Método: Login con contraseña incorrecta → con datos email="juan@example.com", password="password123" → resultado: error 400 "Contraseña incorrecta"');
      console.log('✅ Status obtenido:', res.status.mock.calls[0][0]);
      console.log('✅ Response obtenida:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      
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
        role: 'volunteer'
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
        id: mockUser._id      });
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la base de datos', async () => {
      // Arrange
      console.log('\n📋 CASO 4: Error del servidor (base de datos)');
      console.log('📊 Datos de entrada:', JSON.stringify(req.body, null, 2));
      
      User.findOne.mockRejectedValue(new Error('Database connection error'));

      // Spy en console.log para verificar que se registra el error
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await login(req, res);

      // Assert
      console.log('✅ Método: Login con error de BD → con datos email="juan@example.com", password="password123" → resultado: error 500 "Error en el servidor"');
      console.log('✅ Status obtenido:', res.status.mock.calls[0][0]);
      console.log('✅ Response obtenida:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      
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
        role: 'volunteer'
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
        role: 'volunteer'
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

  describe('Verificación de estructura de respuesta', () => {    test('Debe incluir todos los campos requeridos en la respuesta exitosa', async () => {
      // Arrange
      const mockUser = {
        _id: 'user-id-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: mockGenerateHash('password123'),
        role: 'volunteer'
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
        role: 'volunteer'
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
