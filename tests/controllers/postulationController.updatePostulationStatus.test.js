const { updatePostulationStatus } = require('../../controllers/postulationController');

// Mock de mongoose primero
jest.mock('mongoose', () => ({
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  model: jest.fn(),
  connect: jest.fn()
}));

// Mock de todas las dependencias ANTES de importar el controlador
jest.mock('../../models/Postulation', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../../models/Notification', () => jest.fn().mockImplementation(() => ({
  save: jest.fn()
})));

const Postulacion = require('../../models/Postulation');
const Notification = require('../../models/Notification');

describe('PostulationController - updatePostulationStatus', () => {
  let req, res;

  beforeEach(() => {
    // Configurar mocks de request y response
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Casos de éxito', () => {
    test('Debe actualizar status a "accepted" y crear notificación correctamente', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439011',
          userId: { _id: 'user123' },
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          userId: { _id: 'user789' },
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);
      Notification.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue()
      }));      // Act
      await updatePostulationStatus(req, res);

      // Assert
      console.log('=== CASO ÉXITO - Status Accepted ===');
      console.log('Input:', JSON.stringify(req.body, null, 2));
      console.log('Response Status:', res.status.mock.calls[0][0]);
      console.log('Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('===============================');
      
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: mockIds } });
      expect(mockPostulations[0].save).toHaveBeenCalled();
      expect(mockPostulations[1].save).toHaveBeenCalled();
      expect(mockPostulations[0].status).toBe('accepted');
      expect(mockPostulations[1].status).toBe('accepted');
      expect(Notification).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Postulations status updated successfully',
        postulaciones: mockPostulations
      });
    });

    test('Debe actualizar status a "rejected" sin crear notificaciones', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439013'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439013',
          userId: { _id: 'user123' },
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'rejected'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: mockIds } });
      expect(mockPostulations[0].save).toHaveBeenCalled();
      expect(mockPostulations[0].status).toBe('rejected');
      expect(Notification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Postulations status updated successfully',
        postulaciones: mockPostulations
      });
    });

    test('Debe actualizar status a "pending" correctamente', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439014'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439014',
          userId: { _id: 'user123' },
          projectId: 'project456',
          status: 'rejected',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'pending'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(mockPostulations[0].status).toBe('pending');
      expect(Notification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe manejar postulación aceptada sin userId correctamente', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439015'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439015',
          userId: null, // Sin userId
          projectId: 'project456',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(mockPostulations[0].status).toBe('accepted');
      expect(Notification).not.toHaveBeenCalled(); // No debe crear notificación sin userId
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Casos de validación de entrada', () => {
    test('Debe retornar error 400 para status inválido', async () => {
      // Arrange
      req.body = {
        ids: ['507f1f77bcf86cd799439016'],
        newStatus: 'invalid_status'
      };

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(Postulacion.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' });
    });

    test('Debe validar status "pending" como válido', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439017'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439017',
          status: 'accepted',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'pending'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe validar status "accepted" como válido', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439018'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439018',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe validar status "rejected" como válido', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439019'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439019',
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'rejected'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Casos de postulaciones no encontradas', () => {
    test('Debe retornar error 404 cuando no se encuentran postulaciones', async () => {
      // Arrange
      req.body = {
        ids: ['507f1f77bcf86cd799439020'],
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue([]); // Array vacío      // Act
      await updatePostulationStatus(req, res);

      // Assert
      console.log('=== CASO ERROR 404 - Postulations Not Found ===');
      console.log('Input:', JSON.stringify(req.body, null, 2));
      console.log('Response Status:', res.status.mock.calls[0][0]);
      console.log('Response JSON:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
      console.log('=========================================');
      
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: req.body.ids } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Postulations not found' });
    });

    test('Debe retornar 404 cuando se pasan IDs que no existen', async () => {
      // Arrange
      const nonExistentIds = ['000000000000000000000000', '111111111111111111111111'];
      req.body = {
        ids: nonExistentIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue([]);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: nonExistentIds } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Postulations not found' });
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la búsqueda de postulaciones', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      req.body = {
        ids: ['507f1f77bcf86cd799439021'],
        newStatus: 'accepted'
      };

      Postulacion.find.mockRejectedValue(dbError);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error updating postulations status' });
    });

    test('Debe retornar error 500 si falla al guardar una postulación', async () => {
      // Arrange
      const saveError = new Error('Save operation failed');
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439022',
          status: 'pending',
          save: jest.fn().mockRejectedValue(saveError)
        }
      ];

      req.body = {
        ids: ['507f1f77bcf86cd799439022'],
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error updating postulations status' });
    });

    test('Debe retornar error 500 si falla al crear una notificación', async () => {
      // Arrange
      const notificationError = new Error('Notification creation failed');
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439023',
          userId: { _id: 'user123' },
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: ['507f1f77bcf86cd799439023'],
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);
      Notification.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(notificationError)
      }));

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error updating postulations status' });
    });
  });

  describe('Casos con múltiples postulaciones', () => {
    test('Debe procesar correctamente múltiples postulaciones mixtas', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439024', '507f1f77bcf86cd799439025'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439024',
          userId: { _id: 'user123' }, // Con userId
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        },
        {
          _id: '507f1f77bcf86cd799439025',
          userId: null, // Sin userId
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);
      Notification.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue()
      }));

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(mockPostulations[0].save).toHaveBeenCalled();
      expect(mockPostulations[1].save).toHaveBeenCalled();
      expect(mockPostulations[0].status).toBe('accepted');
      expect(mockPostulations[1].status).toBe('accepted');
      expect(Notification).toHaveBeenCalledTimes(1); // Solo para la que tiene userId
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe procesar array con una sola postulación', async () => {
      // Arrange
      const mockIds = ['507f1f77bcf86cd799439026'];
      const mockPostulations = [
        {
          _id: '507f1f77bcf86cd799439026',
          userId: { _id: 'user123' },
          status: 'pending',
          save: jest.fn().mockResolvedValue()
        }
      ];

      req.body = {
        ids: mockIds,
        newStatus: 'rejected'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(mockPostulations[0].save).toHaveBeenCalled();
      expect(mockPostulations[0].status).toBe('rejected');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Verificación de consulta MongoDB', () => {
    test('Debe usar la consulta correcta para buscar postulaciones por IDs', async () => {
      // Arrange
      const testIds = ['507f1f77bcf86cd799439027', '507f1f77bcf86cd799439028'];
      req.body = {
        ids: testIds,
        newStatus: 'accepted'
      };

      Postulacion.find.mockResolvedValue([]);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      expect(Postulacion.find).toHaveBeenCalledTimes(1);
      expect(Postulacion.find).toHaveBeenCalledWith({ '_id': { $in: testIds } });
    });

    test('Debe procesar el bucle for correctamente con múltiples postulaciones', async () => {
      // Arrange
      const mockPostulations = [
        { _id: '1', status: 'pending', save: jest.fn().mockResolvedValue() },
        { _id: '2', status: 'pending', save: jest.fn().mockResolvedValue() },
        { _id: '3', status: 'pending', save: jest.fn().mockResolvedValue() }
      ];

      req.body = {
        ids: ['1', '2', '3'],
        newStatus: 'rejected'
      };

      Postulacion.find.mockResolvedValue(mockPostulations);

      // Act
      await updatePostulationStatus(req, res);

      // Assert
      mockPostulations.forEach(postulation => {
        expect(postulation.save).toHaveBeenCalled();
        expect(postulation.status).toBe('rejected');
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
