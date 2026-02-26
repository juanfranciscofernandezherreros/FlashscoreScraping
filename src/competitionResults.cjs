const { execSync } = require('child_process');

// Obtener los argumentos de la línea de comandos
const args = process.argv.slice(2);
const [country, league] = args;

if (!country || !league) {
    console.error('Country and league must be specified.');
    process.exit(1);
}

// Configura el directorio de trabajo
const projectDir = './';

// Ejecuta el comando npm para generar el CSV
try {
    execSync(`npm run start -- country=${country} league=${league} action=results includeAll=true generateCSV=true headless`, { cwd: projectDir, stdio: 'inherit' });
    console.log('Comando ejecutado con éxito.');
} catch (error) {
    console.error('Error al ejecutar el comando:', error.message);
    process.exit(1);
}