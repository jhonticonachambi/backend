const { getNotifications } = require('../../controllers/notificationController');

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
jest.mock('../../models/Notification', () => ({
  find: jest.fn(),
  findById: jest.fn()
}));

const Notification = require('../../models/Notification');

describe('NotificationController - getNotifications', () => {
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
    test('Debe retornar notificaciones del usuario correctamente', async () => {
      // Arrange
      const mockUserId = 'user123';
      const mockNotifications = [
        {
          _id: 'notification1',
          userId: 'user123',
          message: '¡Felicidades! Tu postulación ha sido aceptada para el proyecto.',
          read: false,
          createdAt: new Date('2025-05-29T10:00:00.000Z')
        },
        {
          _id: 'notification2',
          userId: 'user123',
          message: 'Tienes una nueva tarea asignada.',
          read: true,
          createdAt: new Date('2025-05-28T15:30:00.000Z')
        },
        {
          _id: 'notification3',
          userId: 'user123',
          message: 'Recordatorio: Reunión del proyecto mañana.',
          read: false,
          createdAt: new Date('2025-05-27T09:15:00.000Z')
        }
      ];

      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    test('Debe retornar una sola notificación correctamente', async () => {
      // Arrange
      const mockUserId = 'user456';
      const mockNotifications = [
        {
          _id: 'notification4',
          userId: 'user456',
          message: 'Bienvenido al proyecto de voluntariado.',
          read: false,
          createdAt: new Date('2025-05-29T12:00:00.000Z')
        }
      ];

      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    test('Debe manejar notificaciones con diferentes estados de lectura', async () => {
      // Arrange
      const mockUserId = 'user789';
      const mockNotifications = [
        {
          _id: 'notification5',
          userId: 'user789',
          message: 'Notificación no leída.',
          read: false
        },
        {
          _id: 'notification6',
          userId: 'user789',
          message: 'Notificación leída.',
          read: true
        }
      ];

      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    test('Debe manejar notificaciones con contenido especial y caracteres especiales', async () => {
      // Arrange
      const mockUserId = 'user101112';
      const mockNotifications = [
        {
          _id: 'notification7',
          userId: 'user101112',
          message: '¡Hola! Tu postulación está en revisión. Más información en: https://ejemplo.com',
          read: false
        },
        {
          _id: 'notification8',
          userId: 'user101112',
          message: 'Evento programado para las 3:30 PM - No faltes!',
          read: false
        }
      ];

      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });
  });

  describe('Casos de validación de entrada', () => {
    test('Debe retornar error 400 cuando no se proporciona userId', async () => {
      // Arrange
      req.body = {}; // Sin userId

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('Debe retornar error 400 cuando userId es null', async () => {
      // Arrange
      req.body = { userId: null };

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('Debe retornar error 400 cuando userId es undefined', async () => {
      // Arrange
      req.body = { userId: undefined };

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('Debe retornar error 400 cuando userId es una cadena vacía', async () => {
      // Arrange
      req.body = { userId: '' };

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('Debe procesar correctamente userId válido como string', async () => {
      // Arrange
      const mockUserId = 'validUserId123';
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Casos de notificaciones no encontradas', () => {
    test('Debe retornar error 404 cuando no hay notificaciones para el usuario', async () => {
      // Arrange
      const mockUserId = 'userWithoutNotifications';
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]); // Array vacío

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No notifications found for this user' });
    });

    test('Debe retornar 404 para usuario que nunca ha tenido notificaciones', async () => {
      // Arrange
      const mockUserId = 'newUser999';
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No notifications found for this user' });
    });

    test('Debe retornar 404 para usuario con ID válido pero sin notificaciones', async () => {
      // Arrange
      const mockUserId = '507f1f77bcf86cd799439011'; // ObjectId válido de MongoDB
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No notifications found for this user' });
    });
  });

  describe('Casos de error del servidor', () => {
    test('Debe retornar error 500 si hay un error en la base de datos', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      const mockUserId = 'user123';
      req.body = { userId: mockUserId };

      Notification.find.mockRejectedValue(dbError);

      // Spy en console.error para verificar que se registra el error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching notifications' });
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching notifications:', dbError);

      // Limpiar spy
      consoleSpy.mockRestore();
    });

    test('Debe manejar errores de timeout de la base de datos', async () => {
      // Arrange
      const timeoutError = new Error('Operation timeout');
      const mockUserId = 'user456';
      req.body = { userId: mockUserId };

      Notification.find.mockRejectedValue(timeoutError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching notifications' });
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching notifications:', timeoutError);

      consoleSpy.mockRestore();
    });

    test('Debe manejar errores de validación de MongoDB', async () => {
      // Arrange
      const validationError = new Error('Invalid query parameter');
      const mockUserId = 'user789';
      req.body = { userId: mockUserId };

      Notification.find.mockRejectedValue(validationError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching notifications' });
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching notifications:', validationError);

      consoleSpy.mockRestore();
    });

    test('Debe manejar errores de red de la base de datos', async () => {
      // Arrange
      const networkError = new Error('Network unreachable');
      const mockUserId = 'user101';
      req.body = { userId: mockUserId };

      Notification.find.mockRejectedValue(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching notifications' });
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching notifications:', networkError);

      consoleSpy.mockRestore();
    });
  });

  describe('Verificación de consulta MongoDB', () => {
    test('Debe usar la consulta correcta para buscar notificaciones por userId', async () => {
      // Arrange
      const testUserId = 'testUser123';
      req.body = { userId: testUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledTimes(1);
      expect(Notification.find).toHaveBeenCalledWith({ userId: testUserId });

      // Verificar que se pasa exactamente el userId proporcionado
      const callArgs = Notification.find.mock.calls[0][0];
      expect(callArgs.userId).toEqual(testUserId);
    });

    test('Debe llamar a Notification.find solo una vez', async () => {
      // Arrange
      const mockUserId = 'singleCallUser';
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledTimes(1);
    });

    test('Debe usar el filtro correcto sin campos adicionales', async () => {
      // Arrange
      const mockUserId = 'pureFilterUser';
      req.body = { userId: mockUserId };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);

      // Assert
      const expectedFilter = { userId: mockUserId };
      expect(Notification.find).toHaveBeenCalledWith(expectedFilter);
      
      // Verificar que no se pasan parámetros adicionales
      expect(Notification.find.mock.calls[0]).toHaveLength(1);
    });
  });

  describe('Verificación de respuesta HTTP', () => {
    test('Debe retornar status 200 para respuesta exitosa con notificaciones', async () => {
      // Arrange
      const mockNotifications = [{ _id: 'test', userId: 'user123', message: 'Test notification' }];
      req.body = { userId: 'user123' };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe retornar los datos en formato JSON con estructura correcta', async () => {
      // Arrange
      const mockNotifications = [
        { _id: 'notif1', userId: 'user123', message: 'Mensaje 1' },
        { _id: 'notif2', userId: 'user123', message: 'Mensaje 2' }
      ];
      req.body = { userId: 'user123' };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
      
      // Verificar estructura de respuesta
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('notifications');
      expect(Array.isArray(responseData.notifications)).toBe(true);
    });

    test('Debe verificar que el encadenamiento de métodos funciona correctamente', async () => {
      // Arrange
      req.body = { userId: 'chainUser' };
      Notification.find.mockResolvedValue([]);

      // Act
      await getNotifications(req, res);      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Casos edge con diferentes tipos de datos', () => {
    test('Debe manejar userId como ObjectId string válido', async () => {
      // Arrange
      const objectIdString = '507f1f77bcf86cd799439011';
      const mockNotifications = [
        { _id: 'notif1', userId: objectIdString, message: 'Test con ObjectId' }
      ];
      
      req.body = { userId: objectIdString };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(Notification.find).toHaveBeenCalledWith({ userId: objectIdString });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debe manejar notificaciones con campos adicionales', async () => {
      // Arrange
      const mockNotifications = [
        {
          _id: 'notif1',
          userId: 'user123',
          message: 'Mensaje completo',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          type: 'info',
          priority: 'high'
        }
      ];
      
      req.body = { userId: 'user123' };
      Notification.find.mockResolvedValue(mockNotifications);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    test('Debe procesar correctamente gran cantidad de notificaciones', async () => {
      // Arrange
      const largeNotificationArray = Array.from({ length: 100 }, (_, index) => ({
        _id: `notification${index}`,
        userId: 'powerUser',
        message: `Notificación número ${index + 1}`,
        read: index % 2 === 0 // Alterna entre leídas y no leídas
      }));
      
      req.body = { userId: 'powerUser' };
      Notification.find.mockResolvedValue(largeNotificationArray);

      // Act
      await getNotifications(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: largeNotificationArray });
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.notifications).toHaveLength(100);
    });
  });
});
