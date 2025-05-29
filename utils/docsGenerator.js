const fs = require('fs');
const path = require('path');

/**
 * Genera la documentación HTML de la API
 */
function generateApiDocs(endpoints, req) {
  // Leer la plantilla HTML
  const templatePath = path.join(__dirname, '../views/api-docs.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
  
  // Detectar automáticamente la URL del servidor (funciona en cualquier entorno)
  const protocol = req.protocol; // http o https
  const host = req.get('host'); // localhost:5000, backend-rdf2.onrender.com, etc.
  const serverUrl = `${protocol}://${host}`;
  
  // Agrupar endpoints por categoría
  const groupedEndpoints = {
    "Authentication": endpoints.filter(e => e.path.includes('/api/auth')),
    "Users": endpoints.filter(e => e.path.includes('/api/users')),
    "Projects": endpoints.filter(e => e.path.includes('/api/projects')),
    "Postulations": endpoints.filter(e => e.path.includes('/api/postulations')),
    "Tasks": endpoints.filter(e => e.path.includes('/api/tasks')),
    "Reports": endpoints.filter(e => e.path.includes('/api/report')),
    "Volunteers": endpoints.filter(e => e.path.includes('/api/volunteer')),
    "Notifications": endpoints.filter(e => e.path.includes('/api/notification')),
    "Documentation": endpoints.filter(e => e.path === '/docs')
  };

  // Generar HTML para las categorías
  const categoriesHtml = Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => {
    if (categoryEndpoints.length === 0) return '';
    
    return `
      <div class="category">
          <div class="category-header">
              ${category} (${categoryEndpoints.length} endpoints)
          </div>
          ${categoryEndpoints.map(endpoint => {
            return endpoint.methods.map(method => `
              <div class="endpoint">
                  <span class="method ${method.toLowerCase()}">${method}</span>
                  <span class="path">${endpoint.path}</span>
              </div>
            `).join('');
          }).join('')}
      </div>
    `;  }).join('');

  // Reemplazar placeholders en la plantilla (ahora funciona en cualquier entorno)
  htmlTemplate = htmlTemplate.replace('{{SERVER_URL}}', serverUrl);
  htmlTemplate = htmlTemplate.replace('{{TOTAL_ENDPOINTS}}', endpoints.length);
  htmlTemplate = htmlTemplate.replace('{{CATEGORIES_HTML}}', categoriesHtml);

  return htmlTemplate;
}

module.exports = { generateApiDocs };
