const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken
const User = require('../../models/User'); // Importar el modelo User
const { login } = require('../../controllers/authController');

// Mock de las dependencias
jest.mock('../../models/User', () => ({
    findOne: jest.fn(), // Mock del método findOne
}));
jest.mock('bcryptjs', () => ({
    compare: jest.fn(), // Mock del método compare
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(), // Mock del método sign
}));

describe('Pruebas para login en authController', () => {
    it('Debe devolver error si el usuario no existe', async () => {
        User.findOne.mockResolvedValue(null);

        const req = { body: { email: 'test@test.com', password: '123456' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe devolver error si la contraseña es incorrecta', async () => {
        User.findOne.mockResolvedValue({ password: 'hashedPassword' });
        bcrypt.compare.mockResolvedValue(false);

        const req = { body: { email: 'test@test.com', password: '123456' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña incorrecta' });
    });

    it('Debe devolver un token si el login es correcto', async () => {
        User.findOne.mockResolvedValue({ _id: '123', password: 'hashedPassword', name: 'Test' });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('mockToken'); // Configuración del mock para sign

        const req = { body: { email: 'test@test.com', password: '123456' } };
        const res = { json: jest.fn() };

        await login(req, res);

        expect(res.json).toHaveBeenCalledWith({
            token: 'mockToken',
            name: 'Test',
            role: undefined,
            id: '123',
        });
    });
});
