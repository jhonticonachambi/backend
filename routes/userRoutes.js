// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para obtener el perfil del usuario
router.get('/profile', authMiddleware, userController.getProfile);

// Ruta para contar solo los usuarios con rol 'volunteer'
router.get('/count/volunteers', userController.countVolunteers);

// Verificar completitud del perfil del usuario
router.get('/profile-completion/:id', userController.checkProfileCompletion);

// Obtener usuario por ID
router.get('/:id', userController.getUserById);

// Actualizar datos personales básicos
router.put('/update-personal-info', authMiddleware, userController.updatePersonalInfo);

module.exports = router;
