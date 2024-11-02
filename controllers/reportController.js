// controllers/reportController.js
const Project = require('../models/Project');

const getReports = async (req, res) => {
  try {
    const projects = await Project.find().populate('tasks').populate('statusField');
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener detalles de un proyecto específico
const getProjectDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id).populate('tasks').populate('statusField');
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReports,
  getProjectDetails,
};
