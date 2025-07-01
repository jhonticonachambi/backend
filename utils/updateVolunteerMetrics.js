// Script para actualizar métricas de voluntarios existentes
const mongoose = require('mongoose');
const VolunteerProfile = require('../models/Volunteer');

async function updateVolunteerMetrics() {
  try {
    // Actualizar todos los voluntarios con métricas realistas para ML
    const result = await VolunteerProfile.updateMany(
      {},
      {
        $set: {
          'metrics.successRate': 0.85,
          'metrics.totalProjects': 5,
          'metrics.completedProjects': 4,
          'metrics.hoursVolunteered': 120
        }
      }
    );

    console.log(`Voluntarios actualizados: ${result.modifiedCount}`);
    
    const volunteers = await VolunteerProfile.find({}).populate('user', 'name email');
    volunteers.forEach(v => {
      console.log(`- ${v.user?.name}: Proyectos=${v.metrics.totalProjects}, Éxito=${v.metrics.successRate}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = { updateVolunteerMetrics };
