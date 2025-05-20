//router/authRouter.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController'); // Ya está definido correctamente
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

/**
 * REQUERIMIENTO FUNCIONAL: RF-02 - Registro de Voluntario
 * CASO DE USO PRINCIPAL: UC-2.1 - Registrar Voluntario
 */
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
router.get('/profile', authMiddleware, authController.getProfile);

// Recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);

// Reseteo de contraseña
router.post('/reset-password', authController.resetPassword);

// Ruta para contar solo los usuarios con rol 'volunteer'
router.get('/count/volunteers', authController.countVolunteers);

// Verificar completitud del perfil del usuario
router.get('/profile-completion/:id', authController.checkProfileCompletion);

// Obtener usuario por ID
router.get('/:id', authController.getUserById);

// Actualizar datos personales básicos
router.put('/update-personal-info', authMiddleware, authController.updatePersonalInfo);

module.exports = router;
