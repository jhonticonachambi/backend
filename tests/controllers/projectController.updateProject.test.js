// Mock de mongoose primero - incluye Schema.Types.ObjectId
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    set: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn() })),
    Types: {
      ObjectId: jest.fn()
    }
  })),
  model: jest.fn(),
  connect: jest.fn(),
  Types: {
    ObjectId: jest.fn()
  }
}));

// Configurar Schema.Types.ObjectId en el constructor del Schema
const mongoose = require('mongoose');
mongoose.Schema.Types = {
  ObjectId: jest.fn()
};

// Mock del modelo Project ANTES de importar el controlador
jest.mock('../../models/Project', () => ({
  findByIdAndUpdate: jest.fn()
}));

const { updateProject } = require('../../controllers/projectController');
const Project = require('../../models/Project');

describe('projectController - updateProject', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {
    test('debe actualizar un proyecto exitosamente', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        name: 'Proyecto Actualizado',
        description: 'Nueva descripción',
        volunteersRequired: 10
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Actualizado',
        description: 'Nueva descripción',
        requirements: 'Requisitos originales',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 10,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
      expect(res.status).not.toHaveBeenCalled(); // No se llama status cuando todo va bien
    });

    test('debe actualizar solo los campos especificados', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        status: 'en progreso'
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Original',
        description: 'Descripción original',
        requirements: 'Requisitos originales',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'en progreso', // Solo este campo cambió
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        { status: 'en progreso' },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });

    test('debe actualizar múltiples campos del proyecto', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        name: 'Proyecto Completamente Actualizado',
        description: 'Nueva descripción detallada',
        requirements: 'Nuevos requisitos',
        volunteersRequired: 8,
        status: 'finalizado',
        bannerImage: 'http://newimage.com/banner.jpg'
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        ...updates,
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });

    test('debe actualizar fechas del proyecto', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-01')
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Test',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Educación',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-01'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });
  });

  describe('Validaciones', () => {
    test('debe fallar cuando el proyecto no existe', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439999';
      const updates = {
        name: 'Proyecto Inexistente'
      };

      req.params.id = projectId;
      req.body = updates;

      Project.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Proyecto no encontrado' 
      });
    });

    test('debe permitir actualización con body vacío', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {};

      req.params.id = projectId;
      req.body = updates;

      const mockProject = {
        _id: projectId,
        name: 'Proyecto Original',
        description: 'Descripción original',
        requirements: 'Requisitos originales',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        {},
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockProject
      });
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        name: 'Proyecto Test'
      };

      req.params.id = projectId;
      req.body = updates;

      Project.findByIdAndUpdate.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await updateProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });

    test('debe manejar errores de validación de mongoose', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        volunteersRequired: -5 // Valor inválido
      };

      req.params.id = projectId;
      req.body = updates;

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      Project.findByIdAndUpdate.mockRejectedValue(validationError);

      // Act
      await updateProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });

    test('debe manejar errores de cast (ID inválido)', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      const updates = {
        name: 'Proyecto Test'
      };

      req.params.id = invalidId;
      req.body = updates;

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      Project.findByIdAndUpdate.mockRejectedValue(castError);

      // Act
      await updateProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });

    test('debe manejar errores inesperados', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        name: 'Proyecto Test'
      };

      req.params.id = projectId;
      req.body = updates;

      Project.findByIdAndUpdate.mockRejectedValue(new Error('Unexpected error'));

      // Act
      await updateProject(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error en el servidor' 
      });
    });
  });

  describe('Casos edge', () => {
    test('debe manejar actualización de arrays en el proyecto', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        applicants: [
          {
            userId: '507f1f77bcf86cd799439022',
            status: 'accepted'
          }
        ],
        feedback: [
          {
            userId: '507f1f77bcf86cd799439033',
            comment: 'Excelente proyecto'
          }
        ]
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Test',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        applicants: updates.applicants,
        feedback: updates.feedback
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });

    test('debe manejar actualización con valores null', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        bannerImage: null,
        description: null
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Test',
        description: null,
        requirements: 'Requisitos',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        bannerImage: null,
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });

    test('debe manejar actualización con valores de diferentes tipos', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const updates = {
        volunteersRequired: '10', // String en lugar de Number
        startDate: '2024-05-01T00:00:00.000Z', // String en lugar de Date
        status: 'finalizado'
      };

      req.params.id = projectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: projectId,
        name: 'Proyecto Test',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Educación',
        startDate: '2024-05-01T00:00:00.000Z',
        endDate: new Date('2024-06-15'),
        volunteersRequired: '10',
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'finalizado',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });

    test('debe manejar actualización con ID de proyecto muy largo', async () => {
      // Arrange
      const longProjectId = '507f1f77bcf86cd799439011507f1f77bcf86cd799439011';
      const updates = {
        name: 'Proyecto con ID largo'
      };

      req.params.id = longProjectId;
      req.body = updates;

      const mockUpdatedProject = {
        _id: longProjectId,
        name: 'Proyecto con ID largo',
        description: 'Descripción',
        requirements: 'Requisitos',
        type: 'Educación',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        volunteersRequired: 5,
        projectType: 'Presencial',
        organizer: '507f1f77bcf86cd799439022',
        status: 'activo',
        applicants: [],
        feedback: []
      };

      Project.findByIdAndUpdate.mockResolvedValue(mockUpdatedProject);

      // Act
      await updateProject(req, res);

      // Assert
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        longProjectId,
        updates,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Proyecto actualizado',
        project: mockUpdatedProject
      });
    });
  });
});
