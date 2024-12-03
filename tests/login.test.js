const mockingoose = require('mockingoose');
const { register, login } = require('../controllers/authcontroller');
const User = require('../models/User');
const crypto = require('crypto');


describe('Auth Controller Tests', () => {

  beforeEach(() => {
    mockingoose.resetAll(); // Resetear mockingoose antes de cada prueba
  });

  // Test de error si el usuario ya existe
  it('should return error if user already exists', async () => {
    const existingUser = {
      name: 'Jane Doe',
      dni: '87654321',
      email: 'johndoe@example.com',
      address: '456 Oak St',
      password: 'password123',
      skills: ['React'],
      phone: '987654321',
    };

    // Simular que el usuario ya existe
    mockingoose(User).toReturn(existingUser, 'findOne');

    const req = { body: existingUser };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await register(req, res);

    // Verificar que el mensaje de error se devuelva correctamente
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'El usuario ya existe' });
  });

  // Test de error si el usuario no existe en login
  it('should return error if user does not exist', async () => {
    const loginUser = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    // Simular que el usuario no existe
    mockingoose(User).toReturn(null, 'findOne');

    const req = { body: loginUser };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await login(req, res);

    // Verificar que el error se maneja correctamente
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
  });

  // Test de error si la contraseña es incorrecta en login
  it('should return error if incorrect password is provided', async () => {
    const loginUser = {
      email: 'johndoe@example.com',
      password: 'wrongpassword',
    };

    const mockUser = {
      _id: 'someuserId',
      email: 'johndoe@example.com',
      password: crypto.createHash('sha256').update('password123').digest('hex'), // Contraseña cifrada
    };

    // Simular que el usuario existe
    mockingoose(User).toReturn(mockUser, 'findOne');

    const req = { body: loginUser };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await login(req, res);

    // Verificar que la contraseña incorrecta se maneje correctamente
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña incorrecta' });
  });
});
