// const Postulacion = require('../models/Postulation');

// // Crear una nueva postulación
// exports.crearPostulacion = async (req, res) => {
//   const { userId, projectId } = req.body;

//   if (!userId || !projectId) {
//     return res.status(400).json({ mensaje: 'User ID y Project ID son requeridos' });
//   }

//   try {
//     // Verificar si ya existe una postulación para este usuario y proyecto
//     const postulacionExistente = await Postulacion.findOne({ userId, projectId });

//     if (postulacionExistente) {
//       return res.status(400).json({ mensaje: 'Usted ya se postuló a este proyecto, espere a su confirmación' });
//     }

//     // Crear nueva postulación si no existe una previa
//     const nuevaPostulacion = new Postulacion({
//       userId,
//       projectId,
//     });

//     await nuevaPostulacion.save();
//     res.status(201).json(nuevaPostulacion);
//   } catch (error) {
//     console.error('Error al crear la postulación:', error);
//     res.status(500).json({ mensaje: 'Error al crear la postulación' });
//   }
// };

// // Obtener postulaciones por usuario
// exports.obtenerPostulacionesPorUsuario = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const postulaciones = await Postulacion.find({ userId }).populate('projectId', 'name description');
//     res.status(200).json(postulaciones);
//   } catch (error) {
//     console.error('Error al obtener postulaciones:', error);
//     res.status(500).json({ mensaje: 'Error al obtener postulaciones' });
//   }
// };

// // Obtener postulaciones por proyecto
// exports.obtenerPostulacionesPorProyecto = async (req, res) => {
//   const { projectId } = req.params;

//   try {
//     const postulaciones = await Postulacion.find({ projectId }).populate('userId', 'name email');
//     res.status(200).json(postulaciones);
//   } catch (error) {
//     console.error('Error al obtener postulaciones:', error);
//     res.status(500).json({ mensaje: 'Error al obtener postulaciones' });
//   }
// };

// // Actualizar estado de postulaciones seleccionadas
// exports.actualizarEstadoPostulaciones = async (req, res) => {
//   const { ids, nuevoEstado } = req.body;

//   try {
//     await Postulacion.updateMany(
//       { _id: { $in: ids } },
//       { $set: { status: nuevoEstado } }
//     );

//     res.status(200).json({ mensaje: 'Estado de postulaciones actualizado correctamente' });
//   } catch (error) {
//     console.error('Error al actualizar estado de postulaciones:', error);
//     res.status(500).json({ mensaje: 'Error al actualizar el estado de postulaciones' });
//   }
// };
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
    console.error('Error updating postulation status:', error);
    res.status(500).json({ message: 'Error updating postulation status' });
  }
};
