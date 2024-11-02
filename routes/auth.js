const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController'); // Ya está definido correctamente
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Registro de usuario
router.post(
  '/register',
  [
    check('name').notEmpty().withMessage('El nombre completo es obligatorio.'),
    check('dni').notEmpty().withMessage('El DNI es obligatorio.'),
    check('email').isEmail().withMessage('Email inválido.'),
    check('address').notEmpty().withMessage('La dirección es obligatoria.'),
    check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    check('skills').isArray().withMessage('Las habilidades son obligatorias.'),
    check('phone').notEmpty().withMessage('El número de teléfono es obligatorio.'),
  ],
  authController.register
);

// Inicio de sesión
router.post('/login', authController.login);

// Ruta para obtener el perfil del usuario
router.get('/profile', authMiddleware, authController.getProfile); // Cambié userController por authController

// Recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);

router.get('/:id', authController.getUserById);

// Ruta para contar solo los usuarios con rol 'volunteer'
router.get('/count/volunteers', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'volunteer' }); // Filtrar por rol
    res.status(200).json({ count }); // Devolver el conteo como respuesta
  } catch (error) {
    console.error('Error counting volunteers:', error);
    res.status(500).json({ message: 'Error al contar usuarios voluntarios' });
  }
});

module.exports = router;
