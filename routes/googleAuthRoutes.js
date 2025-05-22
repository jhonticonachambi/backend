const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Función para generar un JWT (igual que en authController)
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Ruta para iniciar sesión con Google
router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Ruta de callback después de la autenticación
// router.get(
//   '/callback',
//   passport.authenticate('google', { failureRedirect: 'https://fronted-five.vercel.app/login' }),
//   (req, res) => {
//     // Generar token JWT para el usuario autenticado
//     const token = generateToken(req.user);
    
//     // Redirigir al usuario con el token como parámetro de URL
//     res.redirect(`https://fronted-five.vercel.app/auth-callback?token=${token}&name=${encodeURIComponent(req.user.name)}&role=${req.user.role}&id=${req.user._id}`);
//   }
// );

router.get(
  '/callback',
  (req, res, next) => {
    console.log('Callback URL llamada:', req.url);
    console.log('Query params:', req.query);
    next();
  },
  passport.authenticate('google', { failureRedirect: 'https://fronted-five.vercel.app/login' }),
  (req, res) => {
    console.log('Usuario autenticado:', req.user);
    const token = generateToken(req.user);
    res.redirect(`https://fronted-five.vercel.app/auth-callback?token=${token}&name=${encodeURIComponent(req.user.name)}&role=${req.user.role}&id=${req.user._id}`);
  }
);

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send('Error al cerrar sesión');
    res.redirect('https://fronted-five.vercel.app/');
  });
});

module.exports = router;
