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

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/postulations', require('./routes/postulationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
