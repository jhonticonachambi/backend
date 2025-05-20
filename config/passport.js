const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por email
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Crear un nuevo usuario con valores predeterminados para los campos obligatorios
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: null, // No se necesita contraseña para usuarios de Google
            phone: 'N/A', // Valor predeterminado
            address: 'N/A', // Valor predeterminado
            dni: 'N/A', // Valor predeterminado
            role: 'volunteer',
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serializar usuario
passport.serializeUser((user, done) => done(null, user.id));

// Deserializar usuario
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
