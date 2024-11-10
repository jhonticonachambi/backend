// controllers/taskController.js
const mongoose = require('mongoose'); 
const Task = require('../models/Task');

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

// Listar tareas
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo').populate('project');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTask) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.status(200).json(updatedTask);
  } catch (error) {
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
    const tasks = await Task.find(status ? { status } : {}).populate('assignedTo').populate('project');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Obtener tareas por ID de proyecto
const getTasksByProjectId = async (req, res) => {
  const { projectId } = req.params; // Obtener el ID del proyecto desde los parámetros
  try {
    const tasks = await Task.find({ project: projectId }) // Filtrar tareas donde el campo 'project' sea igual al projectId
      .populate('assignedTo')
      .populate('project');
    if (!tasks.length) return res.status(404).json({ message: 'No se encontraron tareas para este proyecto' });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Aquí está la función que has definido
const obtenerTareasPorUsuarioYProyecto = async (req, res) => {
  const { userId, projectId } = req.params;

  try {
    // Actualiza la consulta para buscar en `assignedTo` y `project`
    const tareas = await Task.find({
      assignedTo: new mongoose.Types.ObjectId(userId), // Usa `new` con ObjectId
      project: new mongoose.Types.ObjectId(projectId)  // Usa `new` con ObjectId
    });
    res.status(200).json(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ mensaje: 'Error al obtener tareas' });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  filterTasks,
  getTasksByProjectId,
  obtenerTareasPorUsuarioYProyecto,
};
