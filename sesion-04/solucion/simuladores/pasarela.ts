// Simulador de la PASARELA DE PAGO QR de un banco (ficticia).
// Tampoco la controlamos: tarda y a veces falla.
//
//   POST /cobros {"monto": 2870, "glosa": "..."}  -> 201 {"id": "QR-...", "estado": "APROBADO", "monto": 2870}
//   GET  /cobros                                  -> lista de cobros recibidos (para revisar en clase)
//   POST /_config {"latenciaMs": 5000, "fallaPorcentaje": 100}  -> cambia el comportamiento en vivo
import { randomUUID } from 'node:crypto';
import * as http from 'node:http';

export interface OpcionesPasarela {
  latenciaMs?: number;
  fallaPorcentaje?: number;
}

export function crearPasarela(opciones: OpcionesPasarela = {}): http.Server {
  const config = {
    latenciaMs: opciones.latenciaMs ?? Number(process.env.PASARELA_LATENCIA_MS ?? 200),
    fallaPorcentaje: opciones.fallaPorcentaje ?? Number(process.env.PASARELA_FALLA_PCT ?? 0),
  };
  const cobros: Array<{ id: string; monto: number; glosa: string; fecha: string }> = [];

  const responder = (res: http.ServerResponse, estado: number, cuerpo: unknown) => {
    res.writeHead(estado, { 'content-type': 'application/json' });
    res.end(JSON.stringify(cuerpo));
  };

  return http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://pasarela');
    let cuerpo = '';
    req.on('data', (parte) => (cuerpo += parte));
    req.on('end', () => {
      const datos = cuerpo ? JSON.parse(cuerpo) : {};

      if (req.method === 'POST' && url.pathname === '/_config') {
        Object.assign(config, datos);
        return responder(res, 200, config);
      }
      if (req.method === 'GET' && url.pathname === '/cobros') {
        return responder(res, 200, cobros);
      }
      if (req.method !== 'POST' || url.pathname !== '/cobros') {
        return responder(res, 404, { error: 'no existe' });
      }

      setTimeout(() => {
        if (!(typeof datos.monto === 'number' && datos.monto > 0)) {
          return responder(res, 400, { error: 'monto inválido' });
        }
        if (Math.random() * 100 < config.fallaPorcentaje) {
          return responder(res, 503, { error: 'servicio no disponible' });
        }
        const cobro = { id: `QR-${randomUUID().slice(0, 8)}`, monto: datos.monto, glosa: String(datos.glosa ?? ''), fecha: new Date().toISOString() };
        cobros.push(cobro);
        responder(res, 201, { id: cobro.id, estado: 'APROBADO', monto: cobro.monto });
      }, config.latenciaMs);
    });
  });
}
