//controllers/postulationController
const Postulacion = require('../models/Postulation');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * REQUERIMIENTO FUNCIONAL: RF-05 - Postulación de Voluntario a Proyecto
 * CASO DE USO PRINCIPAL: UC-5.1 - Postularse a proyecto
 * 
 * CASOS DE USO ANTECEDENTES: 
 * - UC-5.2: Ver lista de proyectos 
 * - UC-5.3: Ver detalle de proyecto
 * 
 * CASOS DE USO POSTERIORES:
 * - UC-5.4: Ver estado de postulación
 * - UC-5.5: Cancelar postulación
 * - UC-8.1: Recibir notificación de aceptación
 * - 
 */
exports.createPostulation = async (req, res) => {
  const { userId, projectId } = req.body;
  if (!userId || !projectId) {
    return res.status(400).json({ message: 'User ID and Project ID are required' });
  }
  
  try {
    // Validación de ObjectId para prevenir inyección
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }
    
    // Convertir a ObjectId para asegurar el tipo correcto
    const validUserId = new mongoose.Types.ObjectId(userId);
    const validProjectId = new mongoose.Types.ObjectId(projectId);
    
    const existingPostulation = await Postulacion.findOne({ 
      userId: validUserId, 
      projectId: validProjectId 
    });
    if (existingPostulation) {
      return res.status(400).json({ message: 'Usted ya se postuló a este proyecto, espere a su confirmación' });
    }
    const newPostulation = new Postulacion({
      userId: validUserId,
      projectId: validProjectId,
    });
    await newPostulation.save();
    res.status(201).json(newPostulation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating postulation' });
  }
};

/**
 * REQUERIMIENTO FUNCIONAL: RF-06 - Asignar voluntario a proyecto
 * CASO DE USO PRINCIPAL: UC-6.1 - Asignación de voluntario a proyecto
 * 
 * CASOS DE USO ANTECEDENTES: 
 * - UC-3.2: Crear proyecto
 * - UC-5.1: Postularse a proyecto
 * - UC-6.2: Ver lista de postulantes
 * - UC-6.3: Ver perfil de voluntario
 * 
 * CASOS DE USO POSTERIORES:
 * - 
 * - UC-9.1: Asignar Tarea
 * - UC-10.1: Generar reporte
 */
exports.updatePostulationStatus = async (req, res) => {
  const { ids, newStatus } = req.body;  // Cambiar a recibir un arreglo de ids
  if (!['pending', 'accepted', 'rejected'].includes(newStatus)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const postulaciones = await Postulacion.find({ '_id': { $in: ids } });
    if (!postulaciones.length) {
      return res.status(404).json({ message: 'Postulations not found' });
    }
    for (const postulation of postulaciones) {
      postulation.status = newStatus;
      await postulation.save();
      if (newStatus === 'accepted' && postulation.userId) {
        const notification = new Notification({
          userId: postulation.userId._id,
          message: '¡Felicidades! Tu postulación ha sido aceptada para el proyecto.',
        });
        await notification.save();
      }
    }
    res.status(200).json({ message: 'Postulations status updated successfully', postulaciones });
  } catch (error) {
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
