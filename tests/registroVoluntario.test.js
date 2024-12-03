process.env.JWT_SECRET = 'myTestSecretKey';
const { register } = require('../controllers/authController');  // Importa el controlador
const mockingoose = require('mockingoose');
const User = require('../models/User');  // Importa el modelo de User
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Simulamos el funcionamiento de validationResult para las pruebas
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('Registro de Usuario - AuthController', () => {
  beforeAll(() => {
    // Configura mockingoose para evitar la conexión a la base de datos real
    mockingoose.resetAll();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe registrar un nuevo usuario y devolver un token', async () => {
    const newUser = {
      name: 'John Doe',
      dni: '12345678',
      email: 'johndoe@example.com',
      address: '123 Main St',
      password: 'password123',
      skills: ['JavaScript', 'Node.js'],
      phone: '123456789',
    };

    // Mockea la función validationResult para que siempre pase la validación
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    });

    // Simula la búsqueda de un usuario existente
    mockingoose(User).toReturn(null, 'findOne');

    // Mockea la función de guardar el usuario
    const savedUser = { ...newUser, _id: '12345' };
    mockingoose(User).toReturn(savedUser, 'save');

    // Simula la generación del token
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    jest.spyOn(jwt, 'sign').mockReturnValue(token);

    const req = {
      body: newUser,
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await register(req, res);

    // Verifica que el token sea devuelto
    expect(res.json).toHaveBeenCalledWith({ token });
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('debe devolver error si el usuario ya existe', async () => {
    const existingUser = {
      name: 'John Doe',
      dni: '12345678',
      email: 'johndoe@example.com',
      address: '123 Main St',
      password: 'password123',
      skills: ['JavaScript', 'Node.js'],
      phone: '123456789',
    };

    // Simula que el usuario ya existe
    mockingoose(User).toReturn(existingUser, 'findOne');

    const req = {
      body: existingUser,
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await register(req, res);

    // Verifica que el estado sea 400 y el mensaje de error correcto
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'El usuario ya existe' });
  });

  it('debe devolver error si los datos no son válidos', async () => {
    const invalidUser = {
      name: '',
      dni: '',
      email: 'invalidemail',
      address: '123 Main St',
      password: 'password123',
      skills: ['JavaScript'],
      phone: '123456789',
    };

    // Simula errores de validación
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ msg: 'Error en el formulario' }]),
    });

    const req = {
      body: invalidUser,
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await register(req, res);

    // Verifica que el estado sea 400 y que haya errores de validación
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Error en el formulario' }],
    });
  });
});
