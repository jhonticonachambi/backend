// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    set: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn() }))
  })),
  model: jest.fn(),
  connect: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

// Configurar mongoose.Schema.Types después del mock
const mongoose = require('mongoose');
mongoose.Schema.Types = {
  ObjectId: jest.fn()
};

// Mock de express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mock del modelo Project ANTES de importar el controlador
jest.mock('../../models/Project', () => {
  const mockSave = jest.fn();
  const mockProject = jest.fn().mockImplementation((data) => {
    const projectInstance = { 
      ...data, 
      _id: '507f1f77bcf86cd799439011',
      status: 'activo',
      applicants: [],
      feedback: []
    };
    projectInstance.save = mockSave;
    return projectInstance;
  });
  
  // Adjuntar el método save al constructor para poder hacer assertions
  mockProject.mockSave = mockSave;
  
  return mockProject;
});

const { createProject } = require('../../controllers/projectController');
const { validationResult } = require('express-validator');
const Project = require('../../models/Project');

describe('projectController - createProject', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Limpiar mocks
    jest.clearAllMocks();
    
    // Mock por defecto de validationResult (sin errores)
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('Casos de éxito', () => {
    test('debe crear un proyecto exitosamente', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Educativo',
        description: 'Un proyecto para educar a la comunidad',
        requirements: 'Experiencia en educación',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        bannerImage: 'http://example.com/banner.jpg',
        organizer: '507f1f77bcf86cd799439022'
      };

      req.body = projectData;

      const mockSavedProject = {
        ...projectData,
        _id: '507f1f77bcf86cd799439011',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.mockSave.mockResolvedValue(mockSavedProject);

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Proyecto Educativo',
        description: 'Un proyecto para educar a la comunidad',
        requirements: 'Experiencia en educación',
        type: 'Educación',
        organizer: '507f1f77bcf86cd799439022'
      }));
      
      expect(Project.mockSave).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith([mockSavedProject]);
    });

    test('debe crear múltiples proyectos cuando se envía un array', async () => {
      // Arrange
      const projectsData = [
        {
          name: 'Proyecto 1',
          description: 'Descripción 1',
          requirements: 'Requisitos 1',
          type: 'Tipo 1',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          volunteersRequired: 3,
          projectType: 'Virtual',
          organizer: '507f1f77bcf86cd799439022'
        },
        {
          name: 'Proyecto 2',
          description: 'Descripción 2',
          requirements: 'Requisitos 2',
          type: 'Tipo 2',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01'),
          volunteersRequired: 4,
          projectType: 'Híbrido',
          organizer: '507f1f77bcf86cd799439033'
        }
      ];

      req.body = projectsData;

      const mockSavedProjects = projectsData.map((data, index) => ({
        ...data,
        _id: `507f1f77bcf86cd79943901${index + 1}`,
        status: 'activo',
        applicants: [],
        feedback: []
      }));

      Project.mockSave.mockResolvedValueOnce(mockSavedProjects[0])
                     .mockResolvedValueOnce(mockSavedProjects[1]);

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledTimes(2);
      expect(Project.mockSave).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedProjects);
    });

    test('debe crear proyecto con campos opcionales', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Mínimo',
        description: 'Descripción básica',
        requirements: 'Sin requisitos especiales',
        type: 'General',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 1,
        projectType: 'Virtual',
        organizer: '507f1f77bcf86cd799439022'
        // Sin bannerImage
      };

      req.body = projectData;

      const mockSavedProject = {
        ...projectData,
        _id: '507f1f77bcf86cd799439011',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.mockSave.mockResolvedValue(mockSavedProject);

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Proyecto Mínimo',
        organizer: '507f1f77bcf86cd799439022'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith([mockSavedProject]);
    });
  });

  describe('Validaciones', () => {
    test('debe fallar con errores de validación', async () => {
      // Arrange
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'description', message: 'Description is required' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors
      });

      req.body = { name: '', description: '' };

      // Act
      await createProject(req, res);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: validationErrors });
      expect(Project).not.toHaveBeenCalled();
    });

    test('debe fallar cuando falta el organizador', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Sin Organizador',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 2,
        projectType: 'Virtual'
        // Sin organizer
      };

      req.body = projectData;

      // Act
      await createProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'El ID del organizador es requerido' 
      });
      expect(Project).not.toHaveBeenCalled();
    });

    test('debe fallar cuando el organizador está vacío', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Con Organizador Vacío',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 2,
        projectType: 'Virtual',
        organizer: '' // Organizador vacío
      };

      req.body = projectData;

      // Act
      await createProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'El ID del organizador es requerido' 
      });
      expect(Project).not.toHaveBeenCalled();
    });    test('debe fallar cuando uno de múltiples proyectos no tiene organizador', async () => {
      // Arrange
      const projectsData = [
        {
          name: 'Proyecto Válido',
          description: 'Descripción',
          requirements: 'Requisitos',
          type: 'Tipo',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          volunteersRequired: 2,
          projectType: 'Virtual',
          organizer: '507f1f77bcf86cd799439022'
        },
        {
          name: 'Proyecto Inválido',
          description: 'Descripción',
          requirements: 'Requisitos',
          type: 'Tipo',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01'),
          volunteersRequired: 3,
          projectType: 'Presencial'
          // Sin organizer
        }
      ];

      req.body = projectsData;

      const mockSavedProject = {
        ...projectsData[0],
        _id: '507f1f77bcf86cd799439011',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.mockSave.mockResolvedValue(mockSavedProject);

      // Act
      await createProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'El ID del organizador es requerido' 
      });
      // El primer proyecto se procesa antes de llegar al error
      expect(Project).toHaveBeenCalledTimes(1);
      expect(Project.mockSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos al guardar', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Test',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 2,
        projectType: 'Virtual',
        organizer: '507f1f77bcf86cd799439022'
      };

      req.body = projectData;

      Project.mockSave.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await createProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });

    test('debe manejar errores de validación de mongoose', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Test',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 2,
        projectType: 'Virtual',
        organizer: '507f1f77bcf86cd799439022'
      };

      req.body = projectData;

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      Project.mockSave.mockRejectedValue(validationError);

      // Act
      await createProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });

    test('debe manejar error en el segundo proyecto de un array', async () => {
      // Arrange
      const projectsData = [
        {
          name: 'Proyecto 1',
          description: 'Descripción 1',
          requirements: 'Requisitos 1',
          type: 'Tipo 1',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-06-15'),
          volunteersRequired: 2,
          projectType: 'Virtual',
          organizer: '507f1f77bcf86cd799439022'
        },
        {
          name: 'Proyecto 2',
          description: 'Descripción 2',
          requirements: 'Requisitos 2',
          type: 'Tipo 2',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01'),
          volunteersRequired: 3,
          projectType: 'Presencial',
          organizer: '507f1f77bcf86cd799439033'
        }
      ];

      req.body = projectsData;

      const mockSavedProject1 = {
        ...projectsData[0],
        _id: '507f1f77bcf86cd799439011',
        status: 'activo'
      };

      Project.mockSave.mockResolvedValueOnce(mockSavedProject1)
                     .mockRejectedValueOnce(new Error('Save failed for second project'));

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledTimes(2);
      expect(Project.mockSave).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });
  });

  describe('Casos edge', () => {
    test('debe manejar array vacío de proyectos', async () => {
      // Arrange
      req.body = [];

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('debe manejar fechas en formato string', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Con Fechas String',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-06-15T23:59:59.999Z',
        volunteersRequired: 2,
        projectType: 'Virtual',
        organizer: '507f1f77bcf86cd799439022'
      };

      req.body = projectData;

      const mockSavedProject = {
        ...projectData,
        _id: '507f1f77bcf86cd799439011',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.mockSave.mockResolvedValue(mockSavedProject);

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-06-15T23:59:59.999Z'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('debe manejar volunteersRequired como string numérico', async () => {
      // Arrange
      const projectData = {
        name: 'Proyecto Con Número String',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Tipo',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: '5', // String en lugar de número
        projectType: 'Virtual',
        organizer: '507f1f77bcf86cd799439022'
      };

      req.body = projectData;

      const mockSavedProject = {
        ...projectData,
        _id: '507f1f77bcf86cd799439011',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.mockSave.mockResolvedValue(mockSavedProject);

      // Act
      await createProject(req, res);

      // Assert
      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        volunteersRequired: '5'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
