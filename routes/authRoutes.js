//router/authRouter.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

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

// Recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);

// Reseteo de contraseña
router.post('/reset-password', authController.resetPassword);

// Habilitar 2FA
router.post('/enable-2fa', authMiddleware, authController.enableTwoFactorAuth);

// Verificar 2FA
router.post('/verify-2fa', authMiddleware, authController.verifyTwoFactorAuth);


module.exports = router;
