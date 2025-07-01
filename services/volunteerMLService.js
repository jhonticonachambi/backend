const axios = require('axios');

class VolunteerMLService {
  constructor(apiUrl = null) {
    // Usar URL de producción por defecto, con fallback a local para desarrollo
    this.apiUrl = apiUrl || process.env.ML_SERVICE_URL || 'https://ml-dgu0.onrender.com';
    
    console.log(`🤖 ML Service configurado para: ${this.apiUrl}`);
    
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 15000, // Aumentar timeout para servicios remotos
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Verifica si el servicio de ML está disponible
   */
  async isHealthy() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('ML Service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Extrae datos relevantes del modelo Volunteer para ML
   */
  extractVolunteerFeatures(volunteer) {
    return {
      reliability: volunteer.reliability || 5,
      punctuality: volunteer.punctuality || 5,
      task_quality: volunteer.taskQuality || 5,
      success_rate: volunteer.successRate || 0,
      total_projects: volunteer.totalProjects || 0,
      completed_projects: volunteer.completedProjects || 0,
      total_hours: volunteer.totalHours || 0,
      availability_hours: volunteer.availabilityHours || 0
    };
  }

  /**
   * Extrae datos relevantes del proyecto para ML
   */
  extractProjectFeatures(project) {
    // Calcular duración en semanas
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const durationWeeks = Math.max(1, (endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
    
    // Estimar complejidad basada en el tipo de proyecto (simplificado)
    const complexityMap = {
      'educación': 6,
      'medio ambiente': 7,
      'salud': 8,
      'tecnología': 9,
      'social': 5,
      'deportes': 4,
      'cultura': 5,
      'otros': 6
    };
    
    const complexity = complexityMap[project.projectType?.toLowerCase()] || 6;
    
    // Estimar horas requeridas (simplificado)
    const estimatedHours = durationWeeks * 10; // 10 horas por semana promedio
    
    return {
      project_duration: Math.round(durationWeeks * 10) / 10,
      project_complexity: complexity,
      required_hours: estimatedHours
    };
  }

  /**
   * Predice si un voluntario es adecuado para un proyecto
   */
  async predictVolunteerSuitability(volunteer, project) {
    try {
      // Verificar salud del servicio
      if (!(await this.isHealthy())) {
        throw new Error('ML Service is not available');
      }

      // Extraer características
      const volunteerFeatures = this.extractVolunteerFeatures(volunteer);
      const projectFeatures = this.extractProjectFeatures(project);

      // Hacer predicción
      const response = await this.axiosInstance.post('/predict', {
        volunteer: volunteerFeatures,
        project: projectFeatures
      });

      return {
        success: true,
        prediction: response.data,
        volunteerData: volunteerFeatures,
        projectData: projectFeatures
      };

    } catch (error) {
      console.error('Error in ML prediction:', error.message);
      
      // Fallback: usar lógica simple si ML falla
      const fallbackResult = this.simpleFallbackLogic(volunteer, project);
      
      return {
        success: false,
        error: error.message,
        fallback: fallbackResult,
        prediction: {
          is_suitable: fallbackResult.isSuitable,
          confidence: 0.5,
          probability_suitable: fallbackResult.score / 10,
          message: "Predicción basada en lógica simple (ML no disponible)"
        }
      };
    }
  }

  /**
   * Lógica simple de fallback si ML no está disponible
   */
  simpleFallbackLogic(volunteer, project) {
    const reliability = volunteer.reliability || 5;
    const punctuality = volunteer.punctuality || 5;
    const taskQuality = volunteer.taskQuality || 5;
    const successRate = volunteer.successRate || 0;
    const totalProjects = volunteer.totalProjects || 0;
    const availabilityHours = volunteer.availabilityHours || 0;

    // Calcular score simple
    let score = (reliability + punctuality + taskQuality) / 3;
    
    // Bonus por experiencia
    if (totalProjects >= 5) score += 1;
    if (successRate >= 0.8) score += 1;
    if (availabilityHours >= 20) score += 0.5;

    return {
      isSuitable: score >= 6,
      score: Math.round(score * 10) / 10,
      factors: {
        performance: (reliability + punctuality + taskQuality) / 3,
        experience: totalProjects,
        success_rate: successRate,
        availability: availabilityHours
      }
    };
  }

  /**
   * Obtiene recomendaciones para múltiples voluntarios
   */
  async getVolunteerRecommendations(volunteers, project, limit = 10) {
    const recommendations = [];

    for (const volunteer of volunteers) {
      const prediction = await this.predictVolunteerSuitability(volunteer, project);
      
      recommendations.push({
        volunteer: volunteer,
        prediction: prediction.prediction,
        score: prediction.prediction.probability_suitable,
        mlSuccess: prediction.success
      });

      // Pequeña pausa para no sobrecargar el servicio ML
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ordenar por score descendente y retornar los mejores
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Re-entrena el modelo ML con nuevos datos
   */
  async retrainModel(dataPath = 'data/training_data.csv') {
    try {
      const response = await this.axiosInstance.post('/retrain', {
        data_path: dataPath
      });

      return {
        success: true,
        result: response.data
      };

    } catch (error) {
      console.error('Error retraining model:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene información del modelo ML
   */
  async getModelInfo() {
    try {
      const response = await this.axiosInstance.get('/model/info');
      return {
        success: true,
        info: response.data
      };
    } catch (error) {
      console.error('Error getting model info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado del servicio ML
   */
  async getServiceStatus() {
    try {
      const healthResponse = await this.axiosInstance.get('/health');
      const infoResponse = await this.axiosInstance.get('/');
      
      return {
        success: true,
        health: healthResponse.data,
        info: infoResponse.data,
        connection: 'active'
      };
    } catch (error) {
      console.error('Error getting ML service status:', error.message);
      return {
        success: false,
        error: error.message,
        connection: 'failed'
      };
    }
  }

  /**
   * Obtiene recomendaciones detalladas de voluntarios para un proyecto
   */
  async getDetailedVolunteerRecommendations(volunteers, project, limit = 10, includeAnalysis = true) {
    try {
      const projectFeatures = this.extractProjectFeatures(project);
      const volunteerFeatures = volunteers.map(v => ({
        id: v._id.toString(),
        user: v.user,
        features: this.extractVolunteerFeatures(v),
        skills: v.skillProficiency || {},
        experience: v.projectHistory || []
      }));

      const requestData = {
        project_features: projectFeatures,
        volunteers: volunteerFeatures,
        limit: limit,
        include_analysis: includeAnalysis
      };

      const response = await this.axiosInstance.post('/predict/detailed-recommendations', requestData);
      
      if (response.data.success) {
        return {
          recommendations: response.data.recommendations || [],
          analysis: response.data.analysis || {},
          confidence: response.data.confidence || 0.85
        };
      } else {
        throw new Error(response.data.error || 'Unknown ML service error');
      }
    } catch (error) {
      console.error('Error getting detailed recommendations from ML:', error.message);
      throw error;
    }
  }

  /**
   * Asignación automática de voluntarios usando ML
   */
  async autoAssignVolunteers(project, options = {}) {
    try {
      const projectFeatures = this.extractProjectFeatures(project);
      
      const requestData = {
        project_features: projectFeatures,
        max_volunteers: options.maxVolunteers || 5,
        min_score: options.minScore || 0.7,
        criteria: options.criteria || 'balanced' // balanced, performance, availability
      };

      const response = await this.axiosInstance.post('/assign/auto', requestData);
      
      if (response.data.success) {
        return {
          assignments: response.data.assignments || [],
          analysis: response.data.analysis || {},
          confidence: response.data.confidence || 0.80
        };
      } else {
        throw new Error(response.data.error || 'Unknown ML service error');
      }
    } catch (error) {
      console.error('Error with auto assignment from ML:', error.message);
      throw error;
    }
  }

  /**
   * Re-entrenar el modelo ML con datos actualizados
   */
  async retrainModel(trainingData = null) {
    try {
      const requestData = trainingData ? { training_data: trainingData } : {};
      
      const response = await this.axiosInstance.post('/model/retrain', requestData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Modelo re-entrenado exitosamente',
          metrics: response.data.metrics || {},
          timestamp: response.data.timestamp || new Date().toISOString()
        };
      } else {
        throw new Error(response.data.error || 'Error al re-entrenar modelo');
      }
    } catch (error) {
      console.error('Error retraining ML model:', error.message);
      throw error;
    }
  }

  /**
   * Evaluar si un voluntario es adecuado para un proyecto usando ML
   */
  async evaluateVolunteerForProject(volunteer, project) {
    try {
      const volunteerFeatures = this.extractVolunteerFeatures(volunteer);
      const projectFeatures = this.extractProjectFeatures(project);

      const requestData = {
        volunteer_features: volunteerFeatures,
        project_features: projectFeatures,
        volunteer_skills: volunteer.skillProficiency || {},
        volunteer_experience: volunteer.projectHistory || []
      };

      const response = await this.axiosInstance.post('/predict/evaluate', requestData);
      
      if (response.data.success) {
        return {
          score: response.data.score || 0.5,
          recommendation: response.data.recommendation || 'neutral',
          reasons: response.data.reasons || [],
          warnings: response.data.warnings || [],
          confidence: response.data.confidence || 0.75
        };
      } else {
        throw new Error(response.data.error || 'Unknown ML service error');
      }
    } catch (error) {
      console.error('Error evaluating volunteer for project:', error.message);
      throw error;
    }
  }
}

module.exports = VolunteerMLService;
