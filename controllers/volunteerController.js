const mongoose = require('mongoose');
const VolunteerProfile = require('../models/Volunteer');
const User = require('../models/User');
const Postulation = require('../models/Postulation');
const Project = require('../models/Project');

/**
 * Controlador para gestionar perfiles de voluntarios
 * Algunos campos son editables por el usuario, otros son actualizados automáticamente por el sistema
 */

// Obtener perfil del voluntario actual o por ID
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
      // Buscar perfil con populate para traer datos relacionados
    const profile = await VolunteerProfile.findOne({ user: userId })
      .populate('user', 'name email avatar')
      .populate('projectHistory.project', 'name description');
    
    if (!profile) {
      // En lugar de devolver un error, indicamos que no existe perfil
      return res.status(200).json({ 
        message: 'No existe perfil para este usuario, debe crearlo primero',
        exists: false,
        userId
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear perfil de voluntario inicial
exports.createProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    // Verificar si ya existe un perfil
    const existingProfile = await VolunteerProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Ya existe un perfil para este usuario' });
    }
      // Verificar si el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Campos editables por el usuario en la creación inicial
    const {
      preferredCauses,
      locationPreferences,
      availabilityHours,
      socialMedia,
      profileImage
    } = req.body;
    
    // Crear nuevo perfil solo con los campos permitidos para el usuario
    const newProfile = new VolunteerProfile({
      user: userId,
      preferredCauses,
      locationPreferences,
      availabilityHours,
      socialMedia
    });
    
    // Agregar imagen de perfil si se proporciona (opcional)
    if (profileImage && profileImage.url) {
      newProfile.profileImage = {
        url: profileImage.url,
        altText: profileImage.altText || '',
        uploadedAt: new Date()
      };
    }
    
    await newProfile.save();
    
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error al crear perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar campos editables por el usuario
exports.updateUserFields = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Validar que sea el mismo usuario o un administrador
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para editar este perfil' });
    }
    
    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
      // Filtrar solo los campos que el usuario puede editar
    const {
      preferredCauses,
      locationPreferences,
      availabilityHours,
      socialMedia,
      profileImage
    } = req.body;
      // Objeto con campos actualizables
    const updateFields = {};
    
    if (preferredCauses) updateFields.preferredCauses = preferredCauses;
    if (locationPreferences) updateFields.locationPreferences = locationPreferences;
    if (availabilityHours !== undefined) updateFields.availabilityHours = availabilityHours;
    if (socialMedia) updateFields.socialMedia = socialMedia;
    if (profileImage) updateFields.profileImage = {
      ...profileImage,
      uploadedAt: new Date()
    };
    
    // Actualizar solo los campos permitidos y devolver el documento actualizado
    // La opción upsert:true creará un nuevo documento si no existe
    const updatedProfile = await VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateFields },
      { new: true, runValidators: true, upsert: true }
    );
    
    if (updatedProfile.isNew) {
      console.log('Se ha creado un nuevo perfil para el usuario:', userId);
    }
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar habilidades del voluntario (skill proficiency)
exports.updateSkills = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Validar que sea el mismo usuario o un administrador
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para editar este perfil' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const { skills } = req.body;
      if (!skills || typeof skills !== 'object') {
      return res.status(400).json({ message: 'Se requiere un objeto de habilidades válido' });
    }
    
    // Buscar perfil, si no existe, crearlo
    let profile = await VolunteerProfile.findOne({ user: userId });
    
    if (!profile) {
      // Si no existe un perfil, vamos a crear uno nuevo
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      profile = new VolunteerProfile({
        user: userId,
        preferredCauses: [],
        locationPreferences: [],
        availabilityHours: 0,
        socialMedia: {}
      });
      
      console.log('Creando nuevo perfil para actualizar habilidades, usuario:', userId);
    }
    
    // Convertir el objeto de habilidades a un Map para MongoDB
    const skillMap = new Map();
    Object.entries(skills).forEach(([skill, level]) => {
      // Validar nivel entre 1-5
      if (level >= 1 && level <= 5) {
        skillMap.set(skill, level);
      }
    });
    
    profile.skillProficiency = skillMap;
    await profile.save();
      res.json(profile);
  } catch (error) {
    console.error('Error al actualizar habilidades:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar imagen de perfil
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Validar que sea el mismo usuario o un administrador
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para editar este perfil' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const { url, altText } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'La URL de la imagen es requerida' });
    }
      let profile = await VolunteerProfile.findOne({ user: userId });
    
    if (!profile) {
      // Si no existe un perfil, vamos a crear uno nuevo
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Crear un nuevo perfil básico
      profile = new VolunteerProfile({
        user: userId,
        preferredCauses: [],
        locationPreferences: [],
        availabilityHours: 0,
        socialMedia: {}
      });
      
      console.log('Creando nuevo perfil para el usuario:', userId);
    }
    
    // Actualizar imagen
    profile.profileImage = {
      url,
      altText: altText || '',
      uploadedAt: new Date()    };
    
    await profile.save();
    
    // Indicar si se creó un nuevo perfil o solo se actualizó la imagen
    const isNewProfile = profile._id && profile.isNew;
    console.log(isNewProfile ? 'Perfil creado y actualizada imagen' : 'Imagen de perfil actualizada', 'para el usuario:', userId);
    
    res.json(profile);
  } catch (error) {
    console.error('Error al actualizar imagen de perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Agregar proyecto al historial (controlado por el sistema)
exports.addProjectToHistory = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    
    // Validación de permisos - solo administradores o coordinadores
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs no válidos' });
    }
    
    const { role, startDate } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'El rol es requerido' });
    }
    
    const profile = await VolunteerProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    // Agregar proyecto al historial
    profile.projectHistory.push({
      project: projectId,
      role,
      startDate: startDate || new Date(),
      completed: false
    });
    
    // Actualizar contador de proyectos totales (campo mantenido por el sistema)
    profile.totalProjects += 1;
    profile.lastActive = new Date();
    
    await profile.save();
    
    res.json(profile);
  } catch (error) {
    console.error('Error al agregar proyecto al historial:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Completar un proyecto en el historial
exports.completeProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    
    // Validación de permisos - solo administradores o coordinadores
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs no válidos' });
    }
    
    const { performance, feedback, endDate } = req.body;
    
    // Validar calificación
    if (performance && (performance < 1 || performance > 10)) {
      return res.status(400).json({ message: 'La calificación debe estar entre 1 y 10' });
    }
    
    const profile = await VolunteerProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    // Buscar el proyecto en el historial
    const projectIndex = profile.projectHistory.findIndex(
      p => p.project.toString() === projectId
    );
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Proyecto no encontrado en el historial' });
    }
    
    // Actualizar el proyecto como completado
    profile.projectHistory[projectIndex].completed = true;
    profile.projectHistory[projectIndex].endDate = endDate || new Date();
    
    if (performance) {
      profile.projectHistory[projectIndex].performance = performance;
    }
    
    if (feedback) {
      profile.projectHistory[projectIndex].feedback = feedback;
    }
    
    // Actualizar contadores y métricas (campos mantenidos por el sistema)
    profile.completedProjects += 1;
    
    // Calcular tasa de éxito
    profile.successRate = (profile.completedProjects / profile.totalProjects) * 100;
    
    await profile.save();
    
    res.json(profile);
  } catch (error) {
    console.error('Error al completar proyecto:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar métricas de desempeño (solo por administradores/coordinadores)
exports.updateMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validación de permisos - solo administradores o coordinadores
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const { reliability, punctuality, taskQuality, totalHours } = req.body;
    
    // Validar valores
    if ((reliability !== undefined && (reliability < 0 || reliability > 10)) ||
        (punctuality !== undefined && (punctuality < 0 || punctuality > 10)) ||
        (taskQuality !== undefined && (taskQuality < 0 || taskQuality > 10))) {
      return res.status(400).json({ message: 'Las métricas deben estar entre 0 y 10' });
    }
    
    // Preparar campos a actualizar (solo los que vienen en la petición)
    const updateFields = {};
    
    if (reliability !== undefined) updateFields.reliability = reliability;
    if (punctuality !== undefined) updateFields.punctuality = punctuality;
    if (taskQuality !== undefined) updateFields.taskQuality = taskQuality;
    if (totalHours !== undefined) updateFields.totalHours = totalHours;
    
    const updatedProfile = await VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error al actualizar métricas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Agregar insignia (solo por administradores)
exports.addBadge = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validar permisos - solo administradores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const { badgeName } = req.body;
    
    if (!badgeName) {
      return res.status(400).json({ message: 'Nombre de la insignia es requerido' });
    }
    
    const profile = await VolunteerProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    // Agregar insignia
    profile.badges.push({
      name: badgeName,
      earnedAt: new Date()
    });
    
    await profile.save();
    
    res.json(profile);
  } catch (error) {
    console.error('Error al agregar insignia:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar estado premium/regular (solo administradores)
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validar permisos - solo administradores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
    
    const { status } = req.body;
    
    if (!status || !['regular', 'premium'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido. Debe ser "regular" o "premium"' });
    }
    
    const updatedProfile = await VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { status },
      { new: true }
    );
    
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar última actividad (método interno)
exports.updateLastActive = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('ID de usuario no válido para actualizar lastActive');
      return null;
    }
    
    const updated = await VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { lastActive: new Date() },
      { new: true }
    );
    
    return updated;
  } catch (error) {
    console.error('Error al actualizar última actividad:', error);
    return null;
  }
};

// Obtener todos los perfiles (solo administradores, con paginación)
exports.getAllProfiles = async (req, res) => {
  try {
    // Validar permisos - solo administradores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const profiles = await VolunteerProfile.find()
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await VolunteerProfile.countDocuments();
    
    res.json({
      profiles,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

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
