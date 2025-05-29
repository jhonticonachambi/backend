const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Rutas para la gestión de perfiles de voluntarios
 * Prefix: /api/volunteer-profiles
 */

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * RUTAS ADMINISTRATIVAS
 * Requieren rol de administrador
 */

// GET /admin/all - Obtener todos los perfiles con paginación (params: page, limit)
router.get('/admin/all', volunteerController.getAllProfiles);

/**
 * RUTAS PARA TODOS LOS USUARIOS AUTENTICADOS
 * Cualquier usuario puede acceder a su propio perfil
 */

// GET /:userId? - Obtener perfil propio o de otro usuario
router.get('/:userId?', volunteerController.getProfile);

// POST / - Crear perfil inicial (body: preferredCauses, locationPreferences, availabilityHours, socialMedia)
router.post('/', volunteerController.createProfile);

// PUT /user-fields/:userId? - Actualizar campos editables por el usuario
router.put('/user-fields/:userId?', volunteerController.updateUserFields);

// PUT /skills/:userId? - Actualizar habilidades (niveles entre 1 y 5)
router.put('/skills/:userId?', volunteerController.updateSkills);

// PUT /profile-image/:userId? - Actualizar imagen de perfil
router.put('/profile-image/:userId?', volunteerController.updateProfileImage);

/**
 * RUTAS PARA ADMINISTRADORES Y COORDINADORES
 * Acciones que afectan al progreso y desempeño del voluntario
 */

// POST /:userId/projects/:projectId - Agregar proyecto al historial
router.post('/:userId/projects/:projectId', volunteerController.addProjectToHistory);

// PUT /:userId/projects/:projectId/complete - Completar un proyecto en el historial
router.put('/:userId/projects/:projectId/complete', volunteerController.completeProject);

// PUT /:userId/metrics - Actualizar métricas de desempeño
router.put('/:userId/metrics', volunteerController.updateMetrics);

/**
 * RUTAS EXCLUSIVAS PARA ADMINISTRADORES
 * Acciones administrativas especiales
 */

// POST /:userId/badges - Agregar insignia al perfil
router.post('/:userId/badges', volunteerController.addBadge);

// PUT /:userId/status - Actualizar estado (regular/premium)
router.put('/:userId/status', volunteerController.updateStatus);

/**
 * REQUERIMIENTO FUNCIONAL: RF-08 - Seguimiento de Voluntarios Asignados
 * CASO DE USO PRINCIPAL: UC-8.1 - Realizar Seguimiento de Voluntarios
 */ 
router.get('/seguimiento/:volunteerId', volunteerController.getVolunteerTracking);

module.exports = router;
