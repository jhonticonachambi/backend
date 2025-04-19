// controllers/volunteerTrackingController.js
const mongoose = require('mongoose');
const Postulation = require('../models/Postulation');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * REQUERIMIENTO FUNCIONAL: RF-08 - Seguimiento de Voluntarios Asignados
 * CASO DE USO PRINCIPAL: UC-8.1 - Realizar Seguimiento de Voluntarios
 * 
 * CASOS DE USO ANTECEDENTES: 
 * - UC-2.1: Registrar Voluntario
 * - UC-5.1: Postularse a proyecto
 * - UC-3.3: Ver lista de proyectos
 * 
 * CASOS DE USO POSTERIORES:
 * - 
 * - UC-8.2: Ver voluntarios asignados
 * - UC-8.3: Ver detalle de participacion
 */
exports.getVolunteerTracking = async (req, res) => {
  const { volunteerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
    return res.status(400).json({ message: 'ID de voluntario no válido' });
  }
  try {
    const user = await User.findById(volunteerId);
    if (!user || user.role !== 'volunteer') {
      return res.status(404).json({ message: 'Voluntario no encontrado' });
    }
    const postulations = await Postulation.find({ userId: volunteerId })
      .populate('projectId', 'name startDate endDate status feedback');
    const seguimiento = postulations.map(postulation => {
      const project = postulation.projectId;
      const feedbacks = Array.isArray(project.feedback)
        ? project.feedback.filter(fb => fb.userId.toString() === volunteerId).map(fb => fb.comment)
        : [];
      return {
        projectName: project.name,
        projectDates: { start: project.startDate, end: project.endDate },
        projectStatus: project.status,
        postulationStatus: postulation.status,
        feedback: feedbacks,
      };
    });
    res.status(200).json({ volunteer: user.name, seguimiento });
  } catch (error) {
    console.error('Error al obtener seguimiento del voluntario:', error);
    res.status(500).json({ message: 'Error del servidor al obtener seguimiento' });
  }
};
