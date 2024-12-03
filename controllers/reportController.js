const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');  // Importar el módulo 'path' para manejar rutas de manera segura
const Project = require('../models/Project');
const Postulacion = require('../models/Postulation');
const Task = require('../models/Task');
const User = require('../models/User');

// Generar reporte general
exports.generateGeneralReport = async (req, res) => {
    try {
        // Obtener datos del proyecto
        const projectId = req.params.projectId;
        const project = await Project.findById(projectId)
            .populate('organizer', 'name email') // Organizador
            .populate('applicants.userId', 'name email') // Postulantes
            .lean();

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Obtener tareas asociadas
        const tasks = await Task.find({ project: projectId }).lean();

        // Obtener postulaciones y su estado
        const postulations = await Postulacion.find({ projectId }).lean();

        // Crear el documento PDF
        const doc = new PDFDocument();

        // Definir la ruta donde guardar el archivo PDF
        const reportsDir = path.join(__dirname, '..', 'reports');  // Obtener la ruta absoluta a la carpeta 'reports'

        // Crear la carpeta 'reports' si no existe
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filePath = path.join(reportsDir, `reporte-general-${projectId}.pdf`);

        // Crear el archivo PDF
        doc.pipe(fs.createWriteStream(filePath));

        // Título y cabecera
        doc.fontSize(18).text(`Reporte General: ${project.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Organizador: ${project.organizer.name} (${project.organizer.email})`);
        doc.text(`Estado: ${project.status}`);
        doc.text(`Fecha de inicio: ${project.startDate.toDateString()}`);
        doc.text(`Fecha de finalización: ${project.endDate.toDateString()}`);
        doc.moveDown();

        // Postulantes
        doc.text('Postulaciones:');
        doc.text(`Total de postulantes: ${postulations.length}`);
        const accepted = postulations.filter(p => p.status === 'accepted').length;
        const pending = postulations.filter(p => p.status === 'pending').length;
        const rejected = postulations.filter(p => p.status === 'rejected').length;
        doc.text(`Aceptados: ${accepted}, Pendientes: ${pending}, Rechazados: ${rejected}`);
        doc.moveDown();

        // Tareas
        doc.text('Tareas:');
        doc.text(`Total de tareas: ${tasks.length}`);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        doc.text(`Completadas: ${completedTasks}, Pendientes: ${pendingTasks}`);
        doc.moveDown();

        // Finalizar PDF
        doc.end();

        // Enviar el archivo como respuesta
        res.download(filePath, `reporte-general-${projectId}.pdf`, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                return res.status(500).json({ error: 'Error al generar el reporte' });
            }

            // Eliminar el archivo temporal después de enviarlo
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('Error al generar el reporte:', error);
        res.status(500).json({ error: 'Ocurrió un error al generar el reporte.' });
    }
};
