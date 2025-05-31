# 📊 Configuración de GitHub Pages para Reportes de Pruebas

## 🎯 Objetivo
Configurar GitHub Pages para mostrar automáticamente los reportes HTML de pruebas generados por Jest.

## 🔧 Configuración Necesaria

### 1. Habilitar GitHub Pages en tu repositorio

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. Desplázate hacia abajo hasta **Pages**
4. En **Source**, selecciona **GitHub Actions**
5. Guarda los cambios

### 2. Configuración del Workflow

El archivo `.github/workflows/ci.yml` ya está configurado para:
- ✅ Ejecutar las pruebas automáticamente
- ✅ Generar el reporte HTML con Jest
- ✅ Subirlo a GitHub Pages
- ✅ Mostrar la URL del reporte

### 3. URLs de acceso

Una vez configurado, podrás acceder a:

**URL del reporte:**
```
https://[tu-usuario].github.io/[nombre-repositorio]/
```

**Ejemplo:**
```
https://jhonticonachambi.github.io/backend/
```

## 📋 Pasos para activar

### Paso 1: Verificar que el repositorio sea público
- Los repositorios privados necesitan GitHub Pro para Pages
- O puedes usar GitHub Actions artifacts como alternativa

### Paso 2: Hacer push de los cambios
```bash
git add .
git commit -m "Configure GitHub Pages for test reports"
git push origin main
```

### Paso 3: Verificar la acción
1. Ve a la pestaña **Actions** en GitHub
2. Verifica que el workflow se ejecute correctamente
3. Una vez completado, ve a **Settings → Pages**
4. Verás la URL donde está publicado tu reporte

## 🔍 ¿Qué se despliega?

- **Reporte principal**: `test-report.html` como página de inicio
- **Métricas de cobertura**: Incluidas en el reporte
- **Estadísticas de pruebas**: Todas las suites y tests
- **Resultados detallados**: Por cada prueba individual

## 🛠️ Comandos útiles

```bash
# Generar reporte localmente
npm run test:coverage

# Ver el reporte local
open test-report.html  # macOS
start test-report.html # Windows
xdg-open test-report.html # Linux

# Ejecutar en modo CI (como en GitHub)
npm run test:ci
```

## 🚀 Alternativas si no puedes usar GitHub Pages

### Opción 1: GitHub Actions Artifacts
Los reportes se suben como artifacts y se pueden descargar:

```yaml
- name: Upload test report
  uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: test-report.html
```

### Opción 2: Netlify/Vercel
Despliega automáticamente desde GitHub:
1. Conecta tu repo a Netlify/Vercel
2. Configura build command: `npm test`
3. Configura publish directory: `./` (para el HTML)

### Opción 3: Servir localmente
```bash
# Instalar servidor local
npm install -g http-server

# Servir el reporte
http-server . -p 8080
# Abrir http://localhost:8080/test-report.html
```

## 📈 Beneficios

✅ **Automatización completa**: Se actualiza en cada push
✅ **Acceso público**: Cualquiera puede ver los resultados
✅ **Historial**: GitHub mantiene las versiones anteriores
✅ **Integración CI/CD**: Parte del flujo de desarrollo
✅ **Interfaz bonita**: HTML con estilos y navegación

## 🎉 ¡Listo!

Una vez configurado, cada vez que hagas push:
1. Se ejecutan las pruebas automáticamente
2. Se genera el reporte HTML
3. Se publica en GitHub Pages
4. Tienes una URL pública para compartir los resultados

---

**💡 Tip**: Añade el enlace del reporte a tu README principal para fácil acceso.
