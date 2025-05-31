// // controllers/taskController.js

const mongoose = require('mongoose');
const Task = require('../models/Task');
//const multer = require('multer'); // Si usas multer para subir archivos
const Notification = require('../models/Notification');

// Crear tarea
const createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Listar todas las tareas
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('project');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener tarea por ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignedTo')
      .populate('project');
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });

    res.status(200).json({
      task,
      history: task.history, // Incluir historial de cambios
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca la tarea existente
    const existingTask = await Task.findById(id);
    if (!existingTask) return res.status(404).json({ message: 'Tarea no encontrada' });

    // Actualiza la tarea
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true }).populate('assignedTo');

    // Verifica si el estado cambió antes de llamar a notifyStatusChange
    if (req.body.status && req.body.status !== existingTask.status) {
      await notifyStatusChange(updatedTask);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error al actualizar la tarea:', error);
    res.status(400).json({ message: error.message });
  }
};



// Eliminar tarea
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filtrar tareas por estado
const filterTasks = async (req, res) => {
  const { status } = req.query;
  try {
    const tasks = await Task.find(status ? { status } : {})
      .populate('assignedTo')
      .populate('project');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener tareas por ID de proyecto
const getTasksByProjectId = async (req, res) => {
  const { projectId } = req.params;
  try {
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo')
      .populate('project');
    if (!tasks.length) return res.status(404).json({ message: 'No se encontraron tareas para este proyecto' });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener tareas por usuario y proyecto
const obtenerTareasPorUsuarioYProyecto = async (req, res) => {
  const { userId, projectId } = req.params;
  try {
    const tareas = await Task.find({
      assignedTo: new mongoose.Types.ObjectId(userId),
      project: new mongoose.Types.ObjectId(projectId),
    });
    res.status(200).json(tareas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

// Obtener tareas asignadas al usuario autenticado
const getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación
    const tasks = await Task.find({
      assignedTo: new mongoose.Types.ObjectId(userId)
    })
      .populate('project', 'name description')
      .populate('assignedTo', 'name email');
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas asignadas:', error);
    res.status(500).json({ message: 'Error al obtener tareas asignadas', error: error.message });
  }
};

// Subir documentos asociados a una tarea
const uploadDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });

    const files = req.files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    task.files = task.files.concat(files); // Agregar archivos al arreglo
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función de notificación (puede ser un correo o websocket)
// const notifyStatusChange = (task) => {
//   console.log(`Notificación: La tarea "${task.title}" cambió a "${task.status}".`);
// };
const notifyStatusChange = async (task) => {
  try {
    console.log(`Notificación: La tarea "${task.title}" cambió a "${task.status}".`);
    const message = `La tarea "${task.title}" cambió a "${task.status}".`;

    for (const userId of task.assignedTo) {
      // Verificar si ya existe una notificación igual para el usuario
      const existingNotification = await Notification.findOne({ userId, message });
      if (!existingNotification) {
        await Notification.create({ userId, message });
      }
    }

    console.log(`Notificación guardada: "${message}"`);
  } catch (error) {
    console.error('Error al guardar notificación:', error);
  }
};


const getTaskHistory = async (req, res) => {
  const { id } = req.params;

  try {
    // Busca la tarea por ID
    const task = await Task.findById(id).populate('assignedTo').populate('project');

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Devuelve el historial de cambios almacenado en el campo `history`
    if (!task.history || task.history.length === 0) {
      return res.status(200).json({ message: 'No hay historial para esta tarea', history: [] });
    }

    res.status(200).json(task.history);
  } catch (error) {
    console.error('Error al obtener historial de cambios:', error);
    res.status(500).json({ message: 'Error al obtener historial de cambios' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  filterTasks,
  getTasksByProjectId,
  obtenerTareasPorUsuarioYProyecto,
  getAssignedTasks,
  uploadDocument,
  getTaskHistory
};
