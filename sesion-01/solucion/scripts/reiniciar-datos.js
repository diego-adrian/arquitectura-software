// Copia datos-semilla/ a datos/ (la "base de datos" de la v0 son archivos JSON).
//   node scripts/reiniciar-datos.js            -> borra datos/ y la vuelve a crear
//   node scripts/reiniciar-datos.js --si-falta -> solo la crea si no existe
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const destino = process.env.CUPO_DATOS ?? path.join(raiz, 'datos');
const soloSiFalta = process.argv.includes('--si-falta');

if (soloSiFalta && fs.existsSync(destino)) process.exit(0);

fs.rmSync(destino, { recursive: true, force: true });
fs.cpSync(path.join(raiz, 'datos-semilla'), destino, { recursive: true });
console.log(`Datos reiniciados en ${path.relative(raiz, destino) || destino}`);
