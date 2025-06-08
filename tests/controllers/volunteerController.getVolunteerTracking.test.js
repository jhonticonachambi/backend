// Mock de mongoose primero
const mockObjectId = jest.fn().mockImplementation((id) => ({
  toString: () => id
}));
mockObjectId.isValid = jest.fn();

jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    set: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn() }))
  })),
  model: jest.fn(),
  connect: jest.fn(),
  Types: {
    ObjectId: mockObjectId
  }
}));

// Mock de los modelos ANTES de importar el controlador
jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/Postulation', () => ({
  find: jest.fn()
}));

jest.mock('../../models/Project', () => jest.fn());
jest.mock('../../models/Volunteer', () => jest.fn());

const { getVolunteerTracking } = require('../../controllers/volunteerController');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Postulation = require('../../models/Postulation');

describe('volunteerController - getVolunteerTracking', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {
    test('debe obtener seguimiento de voluntario exitosamente', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Juan Pérez',
        email: 'juan@email.com',
        role: 'volunteer'
      };

      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          userId: volunteerId,
          status: 'accepted',
          projectId: {
            _id: '507f1f77bcf86cd799439033',
            name: 'Proyecto Educación',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-06-15'),
            status: 'active',            feedback: [
              {
                userId: new mongoose.Types.ObjectId(volunteerId),
                comment: 'Excelente trabajo en las actividades'
              },
              {
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439044'),
                comment: 'Otro feedback'
              }
            ]
          }
        },
        {
          _id: '507f1f77bcf86cd799439055',
          userId: volunteerId,
          status: 'pending',
          projectId: {
            _id: '507f1f77bcf86cd799439066',
            name: 'Proyecto Medio Ambiente',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-08-01'),
            status: 'planning',
            feedback: []
          }
        }
      ];

      // Configurar mocks
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue(mockPostulations);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });      // Act
      await getVolunteerTracking(req, res);

      // Console logs para capturar datos
      console.log('=== CASO VOLUNTARIO - Seguimiento Exitoso ===');
      console.log('Input volunteerId:', volunteerId);
      console.log('Mock Response Status:', res.status.mock.calls[0][0]);
      console.log('Mock Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('============================================');

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(volunteerId);
      expect(User.findById).toHaveBeenCalledWith(volunteerId);
      expect(Postulation.find).toHaveBeenCalledWith({ userId: volunteerId });
      expect(mockPopulate).toHaveBeenCalledWith('projectId', 'name startDate endDate status feedback');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        volunteer: 'Juan Pérez',
        seguimiento: [
          {
            projectName: 'Proyecto Educación',
            projectDates: {
              start: new Date('2024-01-15'),
              end: new Date('2024-06-15')
            },
            projectStatus: 'active',
            postulationStatus: 'accepted',
            feedback: ['Excelente trabajo en las actividades']
          },
          {
            projectName: 'Proyecto Medio Ambiente',
            projectDates: {
              start: new Date('2024-03-01'),
              end: new Date('2024-08-01')
            },
            projectStatus: 'planning',
            postulationStatus: 'pending',
            feedback: []
          }
        ]
      });
    });

    test('debe manejar voluntario sin postulaciones', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'María González',
        email: 'maria@email.com',
        role: 'volunteer'
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue([]);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        volunteer: 'María González',
        seguimiento: []
      });
    });

    test('debe manejar proyectos con feedback no array', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Carlos López',
        email: 'carlos@email.com',
        role: 'volunteer'
      };

      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          userId: volunteerId,
          status: 'accepted',
          projectId: {
            _id: '507f1f77bcf86cd799439033',
            name: 'Proyecto Sin Feedback',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-06-15'),
            status: 'completed',
            feedback: null // feedback no es array
          }
        }
      ];

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue(mockPostulations);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        volunteer: 'Carlos López',
        seguimiento: [
          {
            projectName: 'Proyecto Sin Feedback',
            projectDates: {
              start: new Date('2024-01-15'),
              end: new Date('2024-06-15')
            },
            projectStatus: 'completed',
            postulationStatus: 'accepted',
            feedback: []
          }
        ]
      });
    });
  });

  describe('Validaciones', () => {
    test('debe fallar con volunteerId inválido', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      req.params.volunteerId = invalidId;

      mongoose.Types.ObjectId.isValid.mockReturnValue(false);      // Act
      await getVolunteerTracking(req, res);

      // Console logs para capturar datos
      console.log('=== CASO VOLUNTARIO - ID Inválido ===');
      console.log('Input volunteerId:', invalidId);
      console.log('Mock Response Status:', res.status.mock.calls[0][0]);
      console.log('Mock Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('=====================================');

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'ID de voluntario no válido' 
      });
      expect(User.findById).not.toHaveBeenCalled();
    });

    test('debe fallar cuando usuario no existe', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(null);

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(volunteerId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Voluntario no encontrado' 
      });
      expect(Postulation.find).not.toHaveBeenCalled();
    });

    test('debe fallar cuando usuario no es voluntario', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockAdmin = {
        _id: volunteerId,
        name: 'Admin User',
        email: 'admin@email.com',
        role: 'admin' // No es voluntario
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockAdmin);

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Voluntario no encontrado' 
      });
      expect(Postulation.find).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos en User.findById', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error del servidor al obtener seguimiento' 
      });
    });

    test('debe manejar errores en Postulation.find', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Juan Pérez',
        role: 'volunteer'
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockRejectedValue(new Error('Postulation query failed'));
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error del servidor al obtener seguimiento' 
      });
    });

    test('debe manejar errores en el procesamiento de feedback', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Juan Pérez',
        role: 'volunteer'
      };

      // Postulación con proyecto que causa error en el mapeo
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          userId: volunteerId,
          status: 'accepted',
          projectId: null // proyecto null causa error
        }
      ];

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue(mockPostulations);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Error del servidor al obtener seguimiento' 
      });
    });
  });

  describe('Casos edge', () => {
    test('debe manejar feedback con diferentes estructuras', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Ana Martín',
        role: 'volunteer'
      };

      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          userId: volunteerId,
          status: 'accepted',
          projectId: {
            _id: '507f1f77bcf86cd799439033',
            name: 'Proyecto Complejo',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-06-15'),
            status: 'active',            feedback: [
              {
                userId: new mongoose.Types.ObjectId(volunteerId),
                comment: 'Primer feedback'
              },
              {
                userId: new mongoose.Types.ObjectId(volunteerId),
                comment: 'Segundo feedback'
              },
              {
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439044'),
                comment: 'Feedback de otro usuario'
              }
            ]
          }
        }
      ];

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue(mockPostulations);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        volunteer: 'Ana Martín',
        seguimiento: [
          {
            projectName: 'Proyecto Complejo',
            projectDates: {
              start: new Date('2024-01-15'),
              end: new Date('2024-06-15')
            },
            projectStatus: 'active',
            postulationStatus: 'accepted',
            feedback: ['Primer feedback', 'Segundo feedback']
          }
        ]
      });
    });

    test('debe manejar múltiples postulaciones con diferentes estados', async () => {
      // Arrange
      const volunteerId = '507f1f77bcf86cd799439011';
      req.params.volunteerId = volunteerId;

      const mockUser = {
        _id: volunteerId,
        name: 'Pedro Sánchez',
        role: 'volunteer'
      };

      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          userId: volunteerId,
          status: 'accepted',
          projectId: {
            _id: '507f1f77bcf86cd799439033',
            name: 'Proyecto Activo',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-06-15'),
            status: 'active',
            feedback: []
          }
        },
        {
          _id: '507f1f77bcf86cd799439044',
          userId: volunteerId,
          status: 'rejected',
          projectId: {
            _id: '507f1f77bcf86cd799439055',
            name: 'Proyecto Rechazado',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-07-01'),
            status: 'cancelled',
            feedback: []
          }
        },
        {
          _id: '507f1f77bcf86cd799439066',
          userId: volunteerId,
          status: 'pending',
          projectId: {
            _id: '507f1f77bcf86cd799439077',
            name: 'Proyecto Pendiente',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-08-01'),
            status: 'planning',
            feedback: []
          }
        }
      ];

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      
      const mockPopulate = jest.fn().mockResolvedValue(mockPostulations);
      Postulation.find.mockReturnValue({
        populate: mockPopulate
      });

      // Act
      await getVolunteerTracking(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        volunteer: 'Pedro Sánchez',
        seguimiento: [
          {
            projectName: 'Proyecto Activo',
            projectDates: { start: new Date('2024-01-15'), end: new Date('2024-06-15') },
            projectStatus: 'active',
            postulationStatus: 'accepted',
            feedback: []
          },
          {
            projectName: 'Proyecto Rechazado',
            projectDates: { start: new Date('2024-02-01'), end: new Date('2024-07-01') },
            projectStatus: 'cancelled',
            postulationStatus: 'rejected',
            feedback: []
          },
          {
            projectName: 'Proyecto Pendiente',
            projectDates: { start: new Date('2024-03-01'), end: new Date('2024-08-01') },
            projectStatus: 'planning',
            postulationStatus: 'pending',
            feedback: []
          }
        ]
      });
    });
  });
});
