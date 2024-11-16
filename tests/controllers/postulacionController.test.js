const { crearPostulacion, obtenerPostulacionesPorUsuario, obtenerPostulacionesPorProyecto, actualizarEstadoPostulaciones } = require('../../controllers/PostulacionController');
const Postulacion = require('../../models/Postulacion');

jest.mock('../../models/Postulacion'); // Mock del modelo Postulacion

describe('Controlador de Postulaciones', () => {
  
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn(); // Mockear console.error
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiar los mocks después de cada prueba
  });


  describe('actualizarEstadoPostulaciones', () => {
    it('Debe actualizar el estado de las postulaciones', async () => {
      const req = {
        body: {
          ids: ['60b9f5f0f5f0f0f0f5f0f0f0', '60b9f5f0f5f0f0f0f5f0f0f1'],
          nuevoEstado: 'accepted',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Postulacion.updateMany.mockResolvedValue({});

      await actualizarEstadoPostulaciones(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Estado de postulaciones actualizado correctamente' });
    });

    it('Debe devolver un error si falla la actualización', async () => {
      const req = {
        body: {
          ids: ['60b9f5f0f5f0f0f0f5f0f0f0'],
          nuevoEstado: 'rejected',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Postulacion.updateMany.mockRejectedValue(new Error('Error al actualizar estado'));

      await actualizarEstadoPostulaciones(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ mensaje: 'Error al actualizar el estado de postulaciones' });
    });
  });

});
