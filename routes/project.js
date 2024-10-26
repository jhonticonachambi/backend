//routes/projects.js
const express = require('express');
const { check } = require('express-validator');
const projectController = require('../controllers/projectController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Crear un nuevo proyecto
router.post(
  '/',
  [
    check('name').not().isEmpty().withMessage('El nombre es requerido'),
    check('description').not().isEmpty().withMessage('La descripción es requerida'),
    check('requirements').not().isEmpty().withMessage('Los requisitos son requeridos'),
    check('type').not().isEmpty().withMessage('El tipo es requerido'),
    check('startDate').not().isEmpty().withMessage('La fecha de inicio es requerida'),
    check('endDate').not().isEmpty().withMessage('La fecha de finalización es requerida'),
    check('volunteersRequired').isNumeric().withMessage('Se requiere un número de voluntarios'),
    check('projectType').not().isEmpty().withMessage('El tipo de proyecto es requerido'),
    check('bannerImage').optional().isURL().withMessage('La imagen del banner debe ser una URL válida')
  ],
  projectController.createProject
);


// Obtener todos los proyectos
router.get('/', projectController.getAllProjects);

// Obtener un proyecto por nombre
router.get('/name/:name', projectController.getProjectByName);

// Obtener un proyecto por ID
router.get('/:id', projectController.getProjectById);

// Postularse a un proyecto
router.post('/:projectId/apply', projectController.applyToProject);

// Agregar retroalimentación a un proyecto
router.post('/:projectId/feedback', projectController.addFeedback);

// Actualizar un proyecto
router.put('/:id', projectController.updateProject);

module.exports = router;
