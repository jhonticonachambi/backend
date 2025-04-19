//server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
    
/**
 * REQUERIMIENTO FUNCIONAL: RF-02 - Registro de Voluntario
 * CASO DE USO PRINCIPAL: UC-2.1 - Registrar Voluntario
 */
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/projects', require('./routes/projectRoutes'));
/**
 * REQUERIMIENTO FUNCIONAL: RF-05 - Postulación de Voluntario a Proyecto
 * CASO DE USO PRINCIPAL: UC-5.1 - Postularse a proyecto
 */
/**
 * REQUERIMIENTO FUNCIONAL: RF-06 - Asignar voluntario a proyecto
 * CASO DE USO PRINCIPAL: UC-6.1 - Asignación de voluntario a proyecto
 */ 
app.use('/api/postulations', require('./routes/postulationRoutes'));

app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));
app.use('/api/notification', require('./routes/notificationRoutes'));
/**
 * REQUERIMIENTO FUNCIONAL: RF-08 - Seguimiento de Voluntarios Asignados
 * CASO DE USO PRINCIPAL: UC-8.1 - Realizar Seguimiento de Voluntarios
 */ 
app.use('/api/volunteers', require('./routes/TrackingRouter'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
