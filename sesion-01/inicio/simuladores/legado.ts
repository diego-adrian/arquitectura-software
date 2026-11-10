// Simulador del SISTEMA ACADÉMICO LEGADO (ficticio).
// Es un sistema antiguo que NO controlamos: responde lento, en CSV separado por ';',
// con siglas sin guion (SIS111), códigos de estudiante sin guion (20231001)
// y estados abreviados (APROB, REPROB, ABAND, CONV).
//
//   GET  /sia/kardex?cod=20231001   -> CSV con el historial del estudiante
//   POST /_config {"latenciaMs": 2000}  -> cambia la latencia en vivo (para las demos)
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

export interface OpcionesLegado {
  latenciaMs?: number;
  archivo?: string;
}

export function crearLegado(opciones: OpcionesLegado = {}): http.Server {
  const config = {
    latenciaMs: opciones.latenciaMs ?? Number(process.env.LEGADO_LATENCIA_MS ?? 300),
  };
  const archivo = opciones.archivo ?? path.join(__dirname, 'kardex.csv');

  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://legado');

    if (req.method === 'POST' && url.pathname === '/_config') {
      let cuerpo = '';
      req.on('data', (parte) => (cuerpo += parte));
      req.on('end', () => {
        Object.assign(config, JSON.parse(cuerpo || '{}'));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(config));
      });
      return;
    }

    if (req.method !== 'GET' || url.pathname !== '/sia/kardex') {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('RECURSO NO EXISTE');
      return;
    }

    const cod = url.searchParams.get('cod') ?? '';
    setTimeout(() => {
      const [cabecera, ...filas] = fs.readFileSync(archivo, 'utf8').trim().split('\n');
      const delEstudiante = filas.filter((fila) => fila.startsWith(`${cod};`));
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8' });
      res.end([cabecera, ...delEstudiante].join('\n') + '\n');
    }, config.latenciaMs);
  });
}
