// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Asegúrate de tener un middleware de autenticación

// Rutas de tareas
router.get('/project/:projectId', authMiddleware, taskController.getTasksByProject); // Obtener tareas por proyecto
router.post('/', authMiddleware, taskController.createTask); // Crear tarea
router.put('/:taskId', authMiddleware, taskController.updateTask); // Actualizar tarea
router.delete('/:taskId', authMiddleware, taskController.deleteTask); // Eliminar tarea

module.exports = router;
