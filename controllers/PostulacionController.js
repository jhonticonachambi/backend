const Postulacion = require('../models/Postulacion');

// Crear una nueva postulación
exports.crearPostulacion = async (req, res) => {
  const { userId, projectId } = req.body;

  if (!userId || !projectId) {
    return res.status(400).json({ mensaje: 'User ID y Project ID son requeridos' });
  }

  try {
    // Verificar si ya existe una postulación para este usuario y proyecto
    const postulacionExistente = await Postulacion.findOne({ userId, projectId });

    if (postulacionExistente) {
      return res.status(400).json({ mensaje: 'Usted ya se postuló a este proyecto, espere a su confirmación' });
    }

    // Crear nueva postulación si no existe una previa
    const nuevaPostulacion = new Postulacion({
      userId,
      projectId,
    });

    await nuevaPostulacion.save();
    res.status(201).json(nuevaPostulacion);
  } catch (error) {
    console.error('Error al crear la postulación:', error);
    res.status(500).json({ mensaje: 'Error al crear la postulación' });
  }
};

// Obtener postulaciones por usuario
exports.obtenerPostulacionesPorUsuario = async (req, res) => {
  const { userId } = req.params;

  try {
    const postulaciones = await Postulacion.find({ userId }).populate('projectId', 'name description');
    res.status(200).json(postulaciones);
  } catch (error) {
    console.error('Error al obtener postulaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener postulaciones' });
  }
};

// Obtener postulaciones por proyecto
exports.obtenerPostulacionesPorProyecto = async (req, res) => {
  const { projectId } = req.params;

  try {
    const postulaciones = await Postulacion.find({ projectId }).populate('userId', 'name email');
    res.status(200).json(postulaciones);
  } catch (error) {
    console.error('Error al obtener postulaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener postulaciones' });
  }
};

// Actualizar estado de postulaciones seleccionadas
exports.actualizarEstadoPostulaciones = async (req, res) => {
  const { ids, nuevoEstado } = req.body;

  try {
    await Postulacion.updateMany(
      { _id: { $in: ids } },
      { $set: { status: nuevoEstado } }
    );

    res.status(200).json({ mensaje: 'Estado de postulaciones actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado de postulaciones:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el estado de postulaciones' });
  }
};
