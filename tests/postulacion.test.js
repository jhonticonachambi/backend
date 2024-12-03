// tests/postulacionProyectos.test.js

const postulationController = require('../controllers/postulationController');
const Postulacion = require('../models/Postulation');

// Mock de los métodos de mongoose
jest.mock('../models/Postulation');

describe('Postulaciones', () => {
  let ids;
  let newStatus;

  beforeEach(() => {
    ids = ['60f5f1b2d5d0a0f2a4f6c830', '60f5f1b2d5d0a0f2a4f6c831']; // IDs de ejemplo
    newStatus = 'accepted'; // Estado de ejemplo
  });

  // Test: Actualizar estado de postulaciones seleccionadas con datos válidos
  it('debe actualizar el estado de las postulaciones seleccionadas con éxito', async () => {
    const req = { body: { ids, newStatus } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock de updateMany para simular que las postulaciones fueron actualizadas
    Postulacion.updateMany.mockResolvedValue({ nModified: 2 });

    await postulationController.updatePostulationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Postulation status updated successfully' });
  });


  // Test: Error en la actualización (simulando una falla de base de datos)
  it('debe manejar un error interno al actualizar el estado de las postulaciones', async () => {
    const req = { body: { ids, newStatus } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock de updateMany para simular un error
    Postulacion.updateMany.mockRejectedValue(new Error('Database error'));

    await postulationController.updatePostulationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error updating postulation status' });
  });
});
