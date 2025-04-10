// // routes/taskRoutes.js
// const express = require('express');
// const taskController = require('../controllers/taskController');
// const router = express.Router();
// const {
//   createTask,
//   getTasks,
//   getTaskById,
//   updateTask,
//   deleteTask,
//   filterTasks,
//   getTasksByProjectId,
//   obtenerTareasPorUsuarioYProyecto
  
// } = require('../controllers/taskController');
// const Task = require('../models/Task'); 


// // Rutas
// router.post('/', createTask);
// router.get('/', getTasks); // Listar tareas
// router.get('/:id', getTaskById);
// router.get('/filter', filterTasks); // Filtrar tareas
// router.put('/:id', updateTask); // Actualizar tarea
// router.delete('/:id', deleteTask); // Eliminar tarea
// router.get('/project/:projectId',getTasksByProjectId);

// // Ruta para contar el total de tareas
// router.get('/count', async (req, res) => {
//   try {
//     const count = await Task.countDocuments(); // Contar todas las tareas
//     res.status(200).json({ count }); // Devolver el conteo como respuesta
//   } catch (error) {
//     console.error('Error counting tasks:', error);
//     res.status(500).json({ message: 'Error al contar tareas' });
//   }
// });

// router.get('/:userId/:projectId',obtenerTareasPorUsuarioYProyecto);

// module.exports = router;

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
