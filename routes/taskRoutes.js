// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/project/:projectId', taskController.getTasksByProjectId);
router.get('/:userId/:projectId', taskController.obtenerTareasPorUsuarioYProyecto);
// Nueva ruta para historial de cambios
router.get('/:id/history', taskController.getTaskHistory);


module.exports = router;
