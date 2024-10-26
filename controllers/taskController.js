// controllers/taskController.js
const Task = require('../models/Task');

// Obtener todas las tareas de un proyecto
exports.getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'name');
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener las tareas', error: err });
  }
};

// Crear una nueva tarea
exports.createTask = async (req, res) => {
  const { title, description, assignedTo, project } = req.body;

  try {
    const newTask = new Task({
      title,
      description,
      assignedTo,
      project,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear la tarea', error: err });
  }
};

// Actualizar el estado de una tarea
exports.updateTask = async (req, res) => {
  const { status } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar la tarea', error: err });
  }
};

// Eliminar una tarea
exports.deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.taskId);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    res.status(200).json({ message: 'Tarea eliminada con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la tarea', error: err });
  }
};
