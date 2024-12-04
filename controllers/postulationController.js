//controllers/postulationController
const Postulacion = require('../models/Postulation');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// // Crear una nueva postulación
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

// Actualizar el estado de una postulación usando el _id de la postulación
// exports.updatePostulationStatus = async (req, res) => {
//   const { postulationId, newStatus } = req.body;

//   console.log('Intentando actualizar el estado de la postulación...');
//   console.log(`Postulation ID: ${postulationId}, Nuevo estado: ${newStatus}`);

//   // Validar que el estado sea válido
//   if (!['pending', 'accepted', 'rejected'].includes(newStatus)) {
//     console.log('Estado inválido proporcionado.');
//     return res.status(400).json({ message: 'Invalid status' });
//   }

//   // Validar que el postulationId sea un ObjectId válido
//   if (!mongoose.Types.ObjectId.isValid(postulationId)) {
//     console.log('Postulation ID inválido proporcionado.');
//     return res.status(400).json({ message: 'Invalid Postulation ID' });
//   }

//   try {
//     // Buscar la postulación por su _id
//     const postulation = await Postulacion.findById(postulationId).populate('userId', 'name email');

//     if (!postulation) {
//       console.log('Postulación no encontrada.');
//       return res.status(404).json({ message: 'Postulation not found' });
//     }

//     // Actualizar el estado de la postulación
//     console.log(`Actualizando estado de la postulación con ID ${postulationId} a ${newStatus}`);
//     postulation.status = newStatus;
//     await postulation.save();
//     console.log('Estado de la postulación actualizado correctamente.');

//     // Si el estado es "accepted", crear una notificación
//     if (newStatus === 'accepted' && postulation.userId) {
//       console.log('El estado es "accepted", creando notificación para el usuario...');
//       const notification = new Notification({
//         userId: postulation.userId._id,
//         message: '¡Felicidades! Tu postulación ha sido aceptada para el proyecto.',
//       });

//       await notification.save();
//       console.log(`Notificación creada para el usuario con ID: ${postulation.userId._id}`);
//     }

//     res.status(200).json({ message: 'Postulation status updated successfully', postulation });
//   } catch (error) {
//     console.error('Error actualizando el estado de la postulación:', error);
//     res.status(500).json({ message: 'Error updating postulation status' });
//   }
// };
exports.updatePostulationStatus = async (req, res) => {
  const { ids, newStatus } = req.body;  // Cambiar a recibir un arreglo de ids

  console.log('Intentando actualizar el estado de las postulaciones...');
  console.log(`Postulation IDs: ${ids}, Nuevo estado: ${newStatus}`);

  // Validar que el estado sea válido
  if (!['pending', 'accepted', 'rejected'].includes(newStatus)) {
    console.log('Estado inválido proporcionado.');
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    // Buscar todas las postulaciones con los _id proporcionados
    const postulaciones = await Postulacion.find({ '_id': { $in: ids } });

    if (!postulaciones.length) {
      console.log('No se encontraron postulaciones.');
      return res.status(404).json({ message: 'Postulations not found' });
    }

    // Actualizar el estado de todas las postulaciones encontradas
    for (const postulation of postulaciones) {
      postulation.status = newStatus;
      await postulation.save();

      // Si el estado es "accepted", crear una notificación
      if (newStatus === 'accepted' && postulation.userId) {
        console.log('El estado es "accepted", creando notificación para el usuario...');
        const notification = new Notification({
          userId: postulation.userId._id,
          message: '¡Felicidades! Tu postulación ha sido aceptada para el proyecto.',
        });

        await notification.save();
        console.log(`Notificación creada para el usuario con ID: ${postulation.userId._id}`);
      }
    }

    res.status(200).json({ message: 'Postulations status updated successfully', postulaciones });
  } catch (error) {
    console.error('Error actualizando el estado de las postulaciones:', error);
    res.status(500).json({ message: 'Error updating postulations status' });
  }
};



// Obtener todas las postulaciones
exports.getAllPostulations = async (req, res) => {
  try {
    // Obtener todas las postulaciones
    const postulations = await Postulacion.find()
      .populate('userId', 'name email')  // Incluimos información del usuario
      .populate('projectId', 'name description');  // Incluimos información del proyecto
    
    res.status(200).json(postulations);
  } catch (error) {
    console.error('Error getting all postulations:', error);
    res.status(500).json({ message: 'Error getting all postulations' });
  }
};

// Obtener todas las postulaciones por proyecto
exports.getPostulationsByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const postulations = await Postulacion.find({ projectId })
      .populate('userId', 'name email')
      .populate('projectId', 'name description');
      
    res.status(200).json(postulations);
  } catch (error) {
    console.error('Error getting postulations:', error);
    res.status(500).json({ message: 'Error getting postulations' });
  }
};

// Obtener todas las postulaciones por usuario
exports.getPostulationsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const postulations = await Postulacion.find({ userId })
      .populate('projectId', 'name description')
      .populate('userId', 'name email');
      
    res.status(200).json(postulations);
  } catch (error) {
    console.error('Error getting postulations:', error);
    res.status(500).json({ message: 'Error getting postulations' });
  }
};
