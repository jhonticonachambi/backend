//controllers/postulationController.js

const Postulacion = require('../models/Postulation');

// Crear una nueva postulación
exports.createPostulation = async (req, res) => {
  const { userId, projectId } = req.body;

  if (!userId || !projectId) {
    return res.status(400).json({ message: 'User ID and Project ID are required' });
  }

  try {
    // Verificar si ya existe una postulación para este usuario y proyecto
    const existingPostulation = await Postulacion.findOne({ userId, projectId });

    if (existingPostulation) {
      return res.status(400).json({ message: 'Usted ya se postuló a este proyecto, espere a su confirmación' });
    }

    // Crear nueva postulación si no existe una previa
    const newPostulation = new Postulacion({
      userId,
      projectId,
    });

    await newPostulation.save();
    res.status(201).json(newPostulation);
  } catch (error) {
    console.error('Error creating postulation:', error);
    res.status(500).json({ message: 'Error creating postulation' });
  }
};

// Obtener postulaciones por usuario
exports.getPostulationsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const postulations = await Postulacion.find({ userId }).populate('projectId', 'name description');
    res.status(200).json(postulations);
  } catch (error) {
    console.error('Error getting postulations:', error);
    res.status(500).json({ message: 'Error getting postulations' });
  }
};

// Obtener postulaciones por proyecto
exports.getPostulationsByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const postulations = await Postulacion.find({ projectId }).populate('userId', 'name email');
    res.status(200).json(postulations);
  } catch (error) {
    console.error('Error getting postulations:', error);
    res.status(500).json({ message: 'Error getting postulations' });
  }
};

// Actualizar estado de postulaciones seleccionadas
exports.updatePostulationStatus = async (req, res) => {
  const { ids, newStatus } = req.body;

  try {
    await Postulacion.updateMany(
      { _id: { $in: ids } },
      { $set: { status: newStatus } }
    );

    res.status(200).json({ message: 'Postulation status updated successfully' });
  } catch (error) {
    // console.error('Error updating postulation status:', error);
    res.status(500).json({ message: 'Error updating postulation status' });
  }
};


// Eliminar una postulación
exports.deletePostulation = async (req, res) => {
  const { postulationId } = req.params;

  try {
    const result = await Postulacion.deleteOne({ _id: postulationId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Postulación no encontrada' });
    }

    res.status(200).json({ message: 'Postulación eliminada con éxito' });
  } catch (error) {
    console.error('Error deleting postulation:', error);
    res.status(500).json({ message: 'Error deleting postulation' });
  }
};