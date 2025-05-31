const Project = require('../../models/Project');

describe('Project Model', () => {
  it('should require a name', () => {
    const project = new Project({ 
      description: 'Test description', 
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.name).toBeDefined();
  });

  it('should require a description', () => {
    const project = new Project({ 
      name: 'Test Project',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.description).toBeDefined();
  });

  it('should require requirements', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.requirements).toBeDefined();
  });

  it('should require a type', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.type).toBeDefined();
  });

  it('should require a startDate', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.startDate).toBeDefined();
  });

  it('should require an endDate', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.endDate).toBeDefined();
  });

  it('should require volunteersRequired', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.volunteersRequired).toBeDefined();
  });

  it('should require a projectType', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      organizer: '507f1f77bcf86cd799439011'
    });
    const error = project.validateSync();
    expect(error.errors.projectType).toBeDefined();
  });

  it('should require an organizer', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type'
    });
    const error = project.validateSync();
    expect(error.errors.organizer).toBeDefined();
  });

  it('should default status to activo', () => {
    const project = new Project({ 
      name: 'Test Project',
      description: 'Test description',
      requirements: 'Test requirements',
      type: 'Test type',
      startDate: new Date(),
      endDate: new Date(),
      volunteersRequired: 5,
      projectType: 'Test project type',
      organizer: '507f1f77bcf86cd799439011'
    });
    expect(project.status).toBe('activo');
  });
});
