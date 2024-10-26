const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController'); // Ya está definido correctamente
const authMiddleware = require('../middleware/authMiddleware');

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

module.exports = router;
