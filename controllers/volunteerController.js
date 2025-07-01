const mongoose = require('mongoose');
const VolunteerProfile = require('../models/Volunteer');
const User = require('../models/User');
const Postulation = require('../models/Postulation');
const Project = require('../models/Project');
const VolunteerMLService = require('../services/volunteerMLService');

// Inicializar servicio ML
const mlService = new VolunteerMLService();

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

// Agregar proyecto al historial del voluntario
exports.addProjectToHistory = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs no válidos' });
    }
    
    const profile = await VolunteerProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    profile.projectHistory.push({ project: projectId, completed: false });
    profile.totalProjects = (profile.totalProjects || 0) + 1;
    
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Completar proyecto en el historial del voluntario
exports.completeProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs no válidos' });
    }

    const profile = await VolunteerProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const project = profile.projectHistory.find(p => p.project.toString() === projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    project.completed = true;
    profile.completedProjects = (profile.completedProjects || 0) + 1;
    profile.successRate = profile.completedProjects / profile.totalProjects;

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Actualizar métricas de desempeño (administradores)
exports.updateMetrics = async (req, res) => {
  try {
    // Validar permisos - solo administradores
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }

    const { userId } = req.params;
    const { reliability, punctuality, taskQuality, successRate, completedProjects, totalProjects } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID no válido' });
    }

    const updateFields = {};
    if (reliability !== undefined) updateFields.reliability = reliability;
    if (punctuality !== undefined) updateFields.punctuality = punctuality;
    if (taskQuality !== undefined) updateFields.taskQuality = taskQuality;
    if (successRate !== undefined) updateFields.successRate = successRate;
    if (completedProjects !== undefined) updateFields.completedProjects = completedProjects;
    if (totalProjects !== undefined) updateFields.totalProjects = totalProjects;

    const profile = await VolunteerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Actualizar métricas propias del voluntario
exports.updateMyMetrics = async (req, res) => {
  try {
    const { totalHours } = req.body;

    if (totalHours < 0) {
      return res.status(400).json({ message: 'Horas inválidas' });
    }

    const profile = await VolunteerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { totalHours: totalHours } },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
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
    
    const validUserId = new mongoose.Types.ObjectId(userId);
    
    const { badgeName } = req.body;
    
    if (!badgeName) {
      return res.status(400).json({ message: 'Nombre de la insignia es requerido' });
    }
    
    const profile = await VolunteerProfile.findOne({ user: validUserId });
    
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
    
    const validUserId = new mongoose.Types.ObjectId(userId);
    
    const { status } = req.body;
    
    if (!status || !['regular', 'premium'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido. Debe ser "regular" o "premium"' });
    }
    
    const updatedProfile = await VolunteerProfile.findOneAndUpdate(
      { user: validUserId },
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
  const { volunteerId } = req.params;  if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
    return res.status(400).json({ message: 'ID de voluntario no válido' });
  }
  
  const validVolunteerId = new mongoose.Types.ObjectId(volunteerId);
  
  try {
    const user = await User.findById(validVolunteerId);
    if (!user || user.role !== 'volunteer') {
      return res.status(404).json({ message: 'Voluntario no encontrado' });
    }
    const postulations = await Postulation.find({ userId: validVolunteerId })
      .populate('projectId', 'name startDate endDate status feedback');
    const seguimiento = postulations.map(postulation => {
      const project = postulation.projectId;
      const feedbacks = Array.isArray(project.feedback)
        ? project.feedback.filter(fb => fb.userId.toString() === validVolunteerId.toString()).map(fb => fb.comment)
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

// ============================================================================
// FUNCIONES DE MACHINE LEARNING
// ============================================================================

/**
 * Obtiene recomendaciones de voluntarios para un proyecto usando ML
 */
exports.getVolunteerRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.query;

    // Validar projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto no válido' });
    }

    // Obtener proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Obtener todos los voluntarios activos
    const volunteers = await VolunteerProfile.find({})
      .populate('user', 'name email photo')
      .lean();

    if (volunteers.length === 0) {
      return res.status(200).json({ 
        message: 'No hay voluntarios disponibles',
        recommendations: [] 
      });
    }

    try {
      // Intentar obtener recomendaciones usando ML
      const recommendations = await mlService.getVolunteerRecommendations(
        volunteers, 
        project, 
        parseInt(limit)
      );

      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        totalVolunteers: volunteers.length,
        mlService: 'available',
        recommendations: recommendations || []
      });

    } catch (mlError) {
      console.error('ML Service error:', mlError.message);
      
      // Si el servicio ML falla, generar recomendaciones básicas
      const basicRecommendations = generateBasicRecommendations(volunteers, project, parseInt(limit));
      
      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        totalVolunteers: volunteers.length,
        mlService: 'fallback',
        message: 'Servicio ML no disponible, usando algoritmo básico',
        recommendations: basicRecommendations
      });
    }

  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    res.status(500).json({ message: 'Error del servidor al obtener recomendaciones' });
  }
};

// Función auxiliar para generar recomendaciones básicas cuando ML no está disponible
function generateBasicRecommendations(volunteers, project, limit = 10) {
  return volunteers
    .filter(volunteer => volunteer.user) // Solo voluntarios con usuario válido
    .map(volunteer => {
      // Calcular puntuación básica basada en métricas
      const reliability = volunteer.reliability || 5;
      const punctuality = volunteer.punctuality || 5;
      const taskQuality = volunteer.taskQuality || 5;
      const successRate = volunteer.successRate || 0;
      const experienceScore = Math.min(volunteer.completedProjects || 0, 10) / 10;
      
      // Fórmula básica de puntuación
      const baseScore = ((reliability + punctuality + taskQuality) / 30) * 0.6;
      const experienceWeight = experienceScore * 0.3;
      const successWeight = successRate * 0.1;
      
      const finalScore = Math.min(baseScore + experienceWeight + successWeight, 1);
      
      // Generar razones básicas
      const reasons = [];
      if (reliability >= 8) reasons.push('Alta confiabilidad');
      if (punctuality >= 8) reasons.push('Excelente puntualidad');
      if (taskQuality >= 8) reasons.push('Calidad de trabajo sobresaliente');
      if (volunteer.completedProjects >= 5) reasons.push('Experiencia en múltiples proyectos');
      if (successRate >= 0.8) reasons.push('Alta tasa de éxito');
      if (reasons.length === 0) reasons.push('Voluntario disponible para el proyecto');

      return {
        user: {
          _id: volunteer.user._id,
          name: volunteer.user.name,
          email: volunteer.user.email,
          photo: volunteer.user.photo
        },
        score: finalScore,
        skills: [], // Podríamos extraer skills si están disponibles
        reasons: reasons,
        metrics: {
          reliability: volunteer.reliability,
          punctuality: volunteer.punctuality,
          taskQuality: volunteer.taskQuality,
          successRate: volunteer.successRate,
          completedProjects: volunteer.completedProjects
        }
      };
    })
    .sort((a, b) => b.score - a.score) // Ordenar por puntuación descendente
    .slice(0, limit); // Limitar resultados
}

/**
 * Obtiene recomendaciones detalladas de voluntarios para un proyecto usando ML
 */
exports.getDetailedVolunteerRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 10, includeAnalysis = true } = req.query;

    // Validar projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto no válido' });
    }

    // Obtener proyecto con detalles completos
    const project = await Project.findById(projectId).populate('requiredSkills');
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Obtener todos los voluntarios activos con más detalles
    const volunteers = await VolunteerProfile.find({})
      .populate('user', 'name email photo createdAt')
      .populate('projectHistory.project', 'name type status')
      .lean();

    if (volunteers.length === 0) {
      return res.status(200).json({ 
        message: 'No hay voluntarios disponibles',
        recommendations: [],
        analysis: {
          totalVolunteers: 0,
          averageScore: 0,
          topSkills: []
        }
      });
    }

    try {
      // Intentar obtener recomendaciones detalladas usando ML
      const detailedRecommendations = await mlService.getDetailedVolunteerRecommendations(
        volunteers, 
        project, 
        parseInt(limit),
        includeAnalysis === 'true'
      );

      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType,
          requiredSkills: project.requiredSkills || [],
          startDate: project.startDate,
          endDate: project.endDate
        },
        totalVolunteers: volunteers.length,
        mlService: 'available',
        recommendations: detailedRecommendations.recommendations || [],
        analysis: detailedRecommendations.analysis || {},
        metadata: {
          generatedAt: new Date().toISOString(),
          algorithm: 'ML-Enhanced',
          confidence: detailedRecommendations.confidence || 0.85
        }
      });

    } catch (mlError) {
      console.error('ML Service error for detailed recommendations:', mlError.message);
      
      // Si el servicio ML falla, generar recomendaciones básicas con análisis
      const basicRecommendations = generateBasicRecommendations(volunteers, project, parseInt(limit));
      
      // Análisis básico
      const analysis = {
        averageScore: basicRecommendations.reduce((sum, rec) => sum + rec.score, 0) / basicRecommendations.length || 0,
        scoreDistribution: {
          high: basicRecommendations.filter(r => r.score >= 0.8).length,
          medium: basicRecommendations.filter(r => r.score >= 0.6 && r.score < 0.8).length,
          low: basicRecommendations.filter(r => r.score < 0.6).length
        },
        topReasons: ['Alta confiabilidad', 'Excelente puntualidad', 'Calidad de trabajo sobresaliente']
      };
      
      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        totalVolunteers: volunteers.length,
        mlService: 'fallback',
        message: 'Servicio ML no disponible, usando análisis básico',
        recommendations: basicRecommendations,
        analysis: analysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          algorithm: 'Basic-Fallback',
          confidence: 0.65
        }
      });
    }

  } catch (error) {
    console.error('Error al obtener recomendaciones detalladas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener recomendaciones detalladas' });
  }
};

/**
 * Asignación inteligente de voluntarios usando ML
 */
exports.assignVolunteersWithML = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { volunteerIds, autoAssign = false, notifyVolunteers = true } = req.body;

    // Validar projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto no válido' });
    }

    // Validar que se proporcionen IDs de voluntarios o se permita asignación automática
    if (!volunteerIds && !autoAssign) {
      return res.status(400).json({ 
        message: 'Se requieren IDs de voluntarios o habilitar asignación automática' 
      });
    }

    // Obtener proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    let assignmentResults = [];

    try {
      if (autoAssign) {
        // Asignación automática usando ML
        const autoAssignmentResult = await mlService.autoAssignVolunteers(project, {
          maxVolunteers: req.body.maxVolunteers || 5,
          minScore: req.body.minScore || 0.7
        });
        
        assignmentResults = autoAssignmentResult.assignments || [];
      } else {
        // Asignación manual con validación ML
        const volunteers = await VolunteerProfile.find({
          '_id': { $in: volunteerIds }
        }).populate('user', 'name email');

        for (const volunteer of volunteers) {
          try {
            const evaluation = await mlService.evaluateVolunteerForProject(volunteer, project);
            
            assignmentResults.push({
              volunteerId: volunteer._id,
              volunteerName: volunteer.user?.name,
              assigned: evaluation.score >= 0.6, // Umbral mínimo
              score: evaluation.score,
              reasons: evaluation.reasons || [],
              warnings: evaluation.warnings || []
            });
          } catch (evalError) {
            console.error(`Error evaluating volunteer ${volunteer._id}:`, evalError);
            assignmentResults.push({
              volunteerId: volunteer._id,
              volunteerName: volunteer.user?.name,
              assigned: false,
              score: 0,
              reasons: [],
              warnings: ['Error en evaluación ML']
            });
          }
        }
      }

      // Aquí podrías agregar lógica para crear postulaciones automáticas
      // o enviar notificaciones si notifyVolunteers es true

      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        assignmentType: autoAssign ? 'automatic' : 'manual',
        mlService: 'available',
        results: assignmentResults,
        summary: {
          totalEvaluated: assignmentResults.length,
          successful: assignmentResults.filter(r => r.assigned).length,
          averageScore: assignmentResults.reduce((sum, r) => sum + r.score, 0) / assignmentResults.length || 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (mlError) {
      console.error('ML Service error for assignment:', mlError.message);
      
      // Fallback: asignación básica sin ML
      if (volunteerIds) {
        const volunteers = await VolunteerProfile.find({
          '_id': { $in: volunteerIds }
        }).populate('user', 'name email');

        assignmentResults = volunteers.map(volunteer => ({
          volunteerId: volunteer._id,
          volunteerName: volunteer.user?.name,
          assigned: true, // Asignación básica sin validación
          score: 0.5, // Puntuación neutral
          reasons: ['Asignación manual sin validación ML'],
          warnings: ['Servicio ML no disponible']
        }));
      }

      res.json({
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        assignmentType: autoAssign ? 'automatic' : 'manual',
        mlService: 'fallback',
        message: 'Asignación realizada sin validación ML',
        results: assignmentResults,
        summary: {
          totalEvaluated: assignmentResults.length,
          successful: assignmentResults.filter(r => r.assigned).length,
          averageScore: 0.5
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error en asignación inteligente:', error);
    res.status(500).json({ message: 'Error del servidor en asignación inteligente' });
  }
};

// Evaluar si un voluntario es adecuado para un proyecto usando ML
exports.evaluateVolunteerForProject = async (req, res) => {
  try {
    const { volunteerId, projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(volunteerId) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'IDs no válidos' });
    }

    const volunteer = await VolunteerProfile.findById(volunteerId).populate('user', 'name email');
    if (!volunteer) {
      return res.status(404).json({ message: 'Voluntario no encontrado' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    try {
      const evaluation = await mlService.evaluateVolunteerForProject(volunteer, project);

      res.json({
        volunteer: {
          id: volunteer._id,
          name: volunteer.user?.name,
          email: volunteer.user?.email
        },
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        evaluation,
        mlSuccess: true
      });
    } catch (mlError) {
      console.error('ML Service error for evaluation:', mlError.message);
      
      // Evaluación básica sin ML
      const basicEvaluation = {
        score: 0.5,
        recommendation: 'neutral',
        reasons: ['Evaluación básica sin ML'],
        warnings: ['Servicio ML no disponible']
      };

      res.json({
        volunteer: {
          id: volunteer._id,
          name: volunteer.user?.name,
          email: volunteer.user?.email
        },
        project: {
          id: project._id,
          name: project.name,
          type: project.projectType
        },
        evaluation: basicEvaluation,
        mlSuccess: false,
        message: 'Evaluación realizada sin ML'
      });
    }
  } catch (error) {
    console.error('Error al evaluar voluntario:', error);
    res.status(500).json({ message: 'Error al evaluar voluntario' });
  }
};

// Obtener estado del servicio ML
exports.getMLServiceStatus = async (req, res) => {
  try {
    const status = await mlService.getServiceStatus();
    res.json({
      service: 'Volunteer ML Service',
      status: 'active',
      timestamp: new Date().toISOString(),
      details: status
    });
  } catch (error) {
    console.error('Error al verificar estado ML:', error);
    res.status(500).json({ 
      service: 'Volunteer ML Service',
      status: 'error',
      message: 'Error al conectar con el servicio ML' 
    });
  }
};

// Re-entrenar modelo ML (solo administradores)
exports.retrainMLModel = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción' });
    }

    const retrainResult = await mlService.retrainModel();
    res.json({
      message: 'Modelo ML re-entrenado exitosamente',
      timestamp: new Date().toISOString(),
      result: retrainResult
    });
  } catch (error) {
    console.error('Error al re-entrenar modelo ML:', error);
    res.status(500).json({ message: 'Error al re-entrenar modelo ML' });
  }
};
