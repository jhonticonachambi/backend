# 📋 Plan de Pruebas - Controladores

## Controladores Documentados

- [✅ Auth Controller](./auth-controller.md) - Login y autenticación
- [ ] User Controller - CRUD de usuarios  
- [ ] Project Controller - Gestión de proyectos
- [ ] Task Controller - Gestión de tareas
- [ ] Volunteer Controller - Gestión de voluntarios
- [ ] Notification Controller - Sistema de notificaciones
- [ ] Postulation Controller - Postulaciones
- [ ] Report Controller - Generación de reportes

## Resumen de Pruebas

| Controlador | Métodos | Unitarias | Integración | Estado |
|-------------|---------|-----------|-------------|--------|
| Auth | login() | 6 casos | 1 flujo | ✅ |
| User | CRUD | - | - | ⏳ |
| Project | CRUD | - | - | ⏳ |

## Comandos de Ejecución

```bash
# Todas las pruebas de controladores
npm test -- tests/controllers/

# Controlador específico
npm test -- authController.login.test.js
```

---
**Actualizado**: 7 de junio de 2025
