const VolunteerMLService = require('./services/volunteerMLService');

async function testMLServiceConnection() {
    console.log('🧪 Probando conexión con ML Service...\n');
    
    // Crear instancia del servicio
    const mlService = new VolunteerMLService();
    
    console.log(`📡 Conectando a: ${mlService.apiUrl}\n`);
    
    // Test 1: Health Check
    console.log('1. 🔍 Verificando salud del servicio...');
    try {
        const isHealthy = await mlService.isHealthy();
        console.log(`   ✅ Estado: ${isHealthy ? 'SALUDABLE' : 'NO DISPONIBLE'}\n`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // Test 2: Service Status
    console.log('2. 📊 Obteniendo estado del servicio...');
    try {
        const status = await mlService.getServiceStatus();
        if (status.success) {
            console.log('   ✅ Servicio conectado');
            console.log(`   📋 Modelo: ${status.info.model_type || 'unknown'}`);
            console.log(`   🔄 Estado: ${status.health.status}\n`);
        } else {
            console.log(`   ❌ Error: ${status.error}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // Test 3: Model Info
    console.log('3. 🤖 Información del modelo...');
    try {
        const modelInfo = await mlService.getModelInfo();
        if (modelInfo.success) {
            console.log('   ✅ Información obtenida');
            console.log(`   🧠 Tipo: ${modelInfo.info.implementation || 'unknown'}`);
            console.log(`   📈 Estado: ${modelInfo.info.status}\n`);
        } else {
            console.log(`   ❌ Error: ${modelInfo.error}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // Test 4: Predicción de prueba
    console.log('4. 🎯 Probando predicción...');
    try {
        const sampleVolunteer = {
            reliability: 8,
            punctuality: 9,
            taskQuality: 7,
            successRate: 0.8,
            totalProjects: 5,
            completedProjects: 4,
            totalHours: 200,
            availabilityHours: 40
        };
        
        const sampleProject = {
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
            projectType: 'educación'
        };
        
        const prediction = await mlService.predictVolunteerSuitability(sampleVolunteer, sampleProject);
        
        if (prediction.success) {
            console.log('   ✅ Predicción exitosa');
            console.log(`   🎯 Apto: ${prediction.prediction.is_suitable ? 'SÍ' : 'NO'}`);
            console.log(`   📊 Confianza: ${(prediction.prediction.confidence * 100).toFixed(1)}%`);
            console.log(`   📈 Score: ${(prediction.prediction.probability_suitable * 100).toFixed(1)}%`);
            console.log(`   💬 Mensaje: ${prediction.prediction.message}\n`);
        } else {
            console.log(`   ⚠️ Usando fallback: ${prediction.fallback ? 'SÍ' : 'NO'}`);
            console.log(`   🎯 Apto: ${prediction.prediction.is_suitable ? 'SÍ' : 'NO'}`);
            console.log(`   📊 Confianza: ${(prediction.prediction.confidence * 100).toFixed(1)}%`);
            console.log(`   💬 Mensaje: ${prediction.prediction.message}\n`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    console.log('🎉 Pruebas completadas!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    testMLServiceConnection().catch(console.error);
}

module.exports = testMLServiceConnection;
