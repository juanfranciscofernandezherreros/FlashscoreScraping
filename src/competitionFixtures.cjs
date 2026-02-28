const { execSync } = require('child_process');

// Obtener los argumentos de la línea de comandos
const rawArgs = process.argv.slice(2);

let country, league;

// Support both key=value format (country=spain league=acb) and positional format (spain acb)
const kvArgs = {};
rawArgs.forEach(arg => {
    if (arg.startsWith('country=')) kvArgs.country = arg.slice('country='.length);
    else if (arg.startsWith('league=')) kvArgs.league = arg.slice('league='.length);
});

if (kvArgs.country && kvArgs.league) {
    country = kvArgs.country;
    league = kvArgs.league;
} else {
    [country, league] = rawArgs;
}

if (!country) country = process.env.npm_config_country;
if (!league) league = process.env.npm_config_league;

if (!country) country = 'France';
if (!league) league = 'lnb';

// Configura el directorio de trabajo
const projectDir = './';

// Ejecuta el comando npm para generar el CSV
try {
    execSync(`npm run start -- country=${country} league=${league} action=fixtures generateCSV=true headless`, { cwd: projectDir, stdio: 'inherit' });
    console.log('Comando ejecutado con éxito.');
} catch (error) {
    console.error('Error al ejecutar el comando:', error.message);
    process.exit(1);
}
