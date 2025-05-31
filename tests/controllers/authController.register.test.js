const { register } = require('../../controllers/authController');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Mock de las dependencias ANTES de importar el controlador
jest.mock('../../models/User', () => {
  const mockUser = jest.fn();
  mockUser.findOne = jest.fn();
  return mockUser;
});

const User = require('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('express-validator');

// Mock del modelo User
const mockUser = {
  _id: 'mock-user-id',
  name: '',
  dni: '',
  email: '',
  address: '',
  password: '',
  skills: [],
  phone: '',
  role: '',
  save: jest.fn()
};

User.mockImplementation(function(userData) {
  Object.assign(this, userData);
  this._id = 'mock-user-id';
  this.save = jest.fn().mockResolvedValue();
  return this;
});

// Mock de crypto usando el mismo algoritmo que el controlador
const mockGenerateHash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

describe('AuthController - Register', () => {
  let req, res;
  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {
        name: 'Juan Pérez',
        dni: '12345678',
        email: 'juan@example.com',
        address: 'Calle 123',
        password: 'password123',
        skills: ['JavaScript', 'Node.js'],
        phone: '+51987654321',
        role: 'volunteer'
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

  describe('Casos de éxito', () => {    test('Debe registrar un nuevo usuario correctamente', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null); // Usuario no existe
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await register(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(User.mock.instances[0].save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'mock-user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      expect(res.json).toHaveBeenCalledWith({ 
        token: 'fake-jwt-token',
        id: 'mock-user-id',
        name: 'Juan Pérez', 
        role: 'volunteer'
      });
    });    test('Debe usar rol por defecto "volunteer" si no se proporciona', async () => {
      // Arrange
      delete req.body.role; // Eliminar rol del request
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await register(req, res);

      // Assert
      expect(User.mock.instances[0].save).toHaveBeenCalled();
      const userInstance = User.mock.instances[0];
      expect(userInstance.role).toBe('volunteer');
    });    test('Debe cifrar la contraseña correctamente', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('fake-jwt-token');

      const expectedHashedPassword = mockGenerateHash(req.body.password);

      // Act
      await register(req, res);

      // Assert
      const userInstance = User.mock.instances[0];
      expect(userInstance.password).toBe(expectedHashedPassword);
    });
  });

  describe('Casos de error de validación', () => {
    test('Debe retornar error 400 si la validación falla', async () => {
      // Arrange
      const validationErrors = [
        { msg: 'Email is required', param: 'email' },
        { msg: 'Password is required', param: 'password' }
      ];
      validationResult.mockReturnValue({ 
        isEmpty: () => false, 
        array: () => validationErrors 
      });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: validationErrors });
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error de usuario existente', () => {
    test('Debe retornar error 400 si el usuario ya existe', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      const existingUser = { 
        _id: 'existing-id', 
        email: req.body.email 
      };
      User.findOne.mockResolvedValue(existingUser);

      // Act
      await register(req, res);

      // Assert      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'El usuario ya existe' });
      expect(User.mock.instances).toHaveLength(0);
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la base de datos', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockRejectedValue(new Error('Database error'));

      // Spy en console.error para verificar que se registra el error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });
      expect(consoleSpy).toHaveBeenCalledWith('Error en el registro:', expect.any(Error));

      // Limpiar spy
      consoleSpy.mockRestore();
    });    test('Debe retornar error 500 si falla al guardar el usuario', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      
      // Mock para que el save falle
      User.mockImplementation(function(userData) {
        Object.assign(this, userData);
        this._id = 'mock-user-id';
        this.save = jest.fn().mockRejectedValue(new Error('Save error'));
        return this;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error en el servidor' });
      expect(consoleSpy).toHaveBeenCalledWith('Error en el registro:', expect.any(Error));

      consoleSpy.mockRestore();
      
      // Restaurar el mock original
      User.mockImplementation(function(userData) {
        Object.assign(this, userData);
        this._id = 'mock-user-id';
        this.save = jest.fn().mockResolvedValue();
        return this;
      });
    });
  });

  describe('Verificación de estructura de datos', () => {    test('Debe crear el usuario con todos los campos requeridos', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await register(req, res);

      // Assert
      const userInstance = User.mock.instances[0];
      expect(userInstance.name).toBe(req.body.name);
      expect(userInstance.dni).toBe(req.body.dni);
      expect(userInstance.email).toBe(req.body.email);
      expect(userInstance.address).toBe(req.body.address);
      expect(userInstance.skills).toEqual(req.body.skills);
      expect(userInstance.phone).toBe(req.body.phone);
      expect(userInstance.role).toBe(req.body.role);
      expect(userInstance.password).toBe(mockGenerateHash(req.body.password));
    });
  });

  describe('Verificación de token JWT', () => {    test('Debe generar token JWT con el ID del usuario', async () => {
      // Arrange
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      await register(req, res);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'mock-user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
  });
});
