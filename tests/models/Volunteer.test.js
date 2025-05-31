const mongoose = require('mongoose');
const VolunteerProfile = require('../../models/Volunteer');

// Mock mongoose para evitar conexión a la base de datos
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      once: jest.fn(),
      on: jest.fn(),
    },
  };
});

describe('VolunteerProfile Model', () => {
  beforeAll(() => {
    // Configurar mongoose para testing
    mongoose.set('strictQuery', false);
  });

  it('should require a user reference', () => {
    const volunteer = new VolunteerProfile({
      status: 'regular',
      totalProjects: 5
    });
    const error = volunteer.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
    expect(error.errors.user.message).toBe('Path `user` is required.');
  });

  it('should default status to regular', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011'
    });
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.status).toBe('regular');
  });

  it('should default numeric fields to 0', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011'
    });
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.totalProjects).toBe(0);
    expect(volunteer.completedProjects).toBe(0);
    expect(volunteer.totalHours).toBe(0);
    expect(volunteer.successRate).toBe(0);
    expect(volunteer.availabilityHours).toBe(0);
  });

  it('should default performance metrics to 5', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011'
    });
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.reliability).toBe(5);
    expect(volunteer.punctuality).toBe(5);
    expect(volunteer.taskQuality).toBe(5);
  });

  it('should validate status enum values', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      status: 'invalid_status'
    });
    const error = volunteer.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
    expect(error.errors.status.message).toContain('is not a valid enum value');
  });

  it('should accept valid status values', () => {
    const volunteerRegular = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      status: 'regular'
    });
    const volunteerPremium = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439012',
      status: 'premium'
    });
    
    expect(volunteerRegular.validateSync()).toBeUndefined();
    expect(volunteerPremium.validateSync()).toBeUndefined();
    expect(volunteerRegular.status).toBe('regular');
    expect(volunteerPremium.status).toBe('premium');
  });

  it('should validate performance metrics range (0-10)', () => {
    const volunteerLow = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      reliability: -1
    });
    const volunteerHigh = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439012',
      punctuality: 11
    });
    
    const errorLow = volunteerLow.validateSync();
    const errorHigh = volunteerHigh.validateSync();
    
    expect(errorLow).toBeDefined();
    expect(errorLow.errors.reliability).toBeDefined();
    expect(errorHigh).toBeDefined();
    expect(errorHigh.errors.punctuality).toBeDefined();
  });

  it('should accept valid performance metrics within range', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      reliability: 8,
      punctuality: 7,
      taskQuality: 9
    });
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.reliability).toBe(8);
    expect(volunteer.punctuality).toBe(7);
    expect(volunteer.taskQuality).toBe(9);
  });
  it('should accept skillProficiency as Map and arrays for preferences', () => {
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      skillProficiency: { 'JavaScript': 8, 'MongoDB': 7 },
      preferredCauses: ['education', 'environment'],
      locationPreferences: ['remote', 'local']
    });
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.skillProficiency.get('JavaScript')).toBe(8);
    expect(volunteer.skillProficiency.get('MongoDB')).toBe(7);
    expect(volunteer.preferredCauses).toEqual(['education', 'environment']);
    expect(volunteer.locationPreferences).toEqual(['remote', 'local']);
  });  it('should accept complex volunteer profile with all fields', () => {
    const currentDate = new Date();
    const volunteer = new VolunteerProfile({ 
      user: '507f1f77bcf86cd799439011',
      status: 'premium',
      totalProjects: 15,
      completedProjects: 12,
      totalHours: 120,
      reliability: 9,
      punctuality: 8,
      taskQuality: 9,
      successRate: 80,
      preferredCauses: ['technology', 'education'],
      locationPreferences: ['remote'],
      availabilityHours: 20,
      projectHistory: [{
        project: '507f1f77bcf86cd799439022',
        role: 'Developer',
        performance: 9,
        feedback: 'Excellent work',
        completed: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-01')
      }],
      badges: [{
        name: 'First Project Complete',
        earnedAt: currentDate
      }],
      socialMedia: {
        github: 'https://github.com/volunteer',
        linkedin: 'https://linkedin.com/in/volunteer'
      },
      profileImage: {
        url: 'https://example.com/image.jpg',
        altText: 'Volunteer profile image',
        uploadedAt: currentDate
      }
    });
    
    const error = volunteer.validateSync();
    expect(error).toBeUndefined();
    expect(volunteer.status).toBe('premium');
    expect(volunteer.totalProjects).toBe(15);
    expect(volunteer.projectHistory).toHaveLength(1);
    expect(volunteer.badges).toHaveLength(1);
    expect(volunteer.socialMedia.github).toBe('https://github.com/volunteer');
  });
});
