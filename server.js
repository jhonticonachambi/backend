//server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const session = require('express-session');
const passport = require('./config/passport');
const listEndpoints = require('express-list-endpoints');
const { generateApiDocs } = require('./utils/docsGenerator');

// Conectar a MongoDB
connectDB();

// Configurar sesiones
app.use(
  session({
    secret: 'your_secret_key', // Cambia esto por una clave secreta segura
    resave: false,
    saveUninitialized: false,
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(cors());
app.use(express.json());

// Rutas de autenticación


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/google', require('./routes/googleAuthRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/postulations', require('./routes/postulationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/report', require('./routes/reportRoutes'));
app.use('/api/volunteer', require('./routes/volunteerRoutes'));
app.use('/api/notification', require('./routes/notificationRoutes'));

// Documentación de API - como /docs de Python FastAPI
app.get('/docs', (req, res) => {
  const endpoints = listEndpoints(app);
  const html = generateApiDocs(endpoints, req);
  res.send(html);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
