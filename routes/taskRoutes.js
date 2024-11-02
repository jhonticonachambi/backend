// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  filterTasks,
  getTasksByProjectId,
  
} = require('../controllers/taskController');
const Task = require('../models/Task'); 

// Rutas
router.post('/', createTask);
router.get('/', getTasks); // Listar tareas
router.get('/filter', filterTasks); // Filtrar tareas
router.put('/:id', updateTask); // Actualizar tarea
router.delete('/:id', deleteTask); // Eliminar tarea
router.get('/project/:projectId',getTasksByProjectId);

// Ruta para contar el total de tareas
router.get('/count', async (req, res) => {
  try {
    const count = await Task.countDocuments(); // Contar todas las tareas
    res.status(200).json({ count }); // Devolver el conteo como respuesta
  } catch (error) {
    console.error('Error counting tasks:', error);
    res.status(500).json({ message: 'Error al contar tareas' });
  }
});

module.exports = router;
