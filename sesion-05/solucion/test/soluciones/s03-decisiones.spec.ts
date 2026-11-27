// SESIÓN 3 · Decisiones arquitectónicas — las soluciones
// Las decisiones quedan escritas, y estas pruebas vigilan que los ADR sigan el formato
// y que el índice no se desactualice.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RAIZ } from '../ayudas/entorno';

const CARPETA = path.join(RAIZ, 'docs', 'adr');
const adrs = () => fs.readdirSync(CARPETA).filter((f) => /^\d{4}-.+\.md$/.test(f) && !f.startsWith('0000'));
const leer = (f: string) => fs.readFileSync(path.join(CARPETA, f), 'utf8');

describe('Sesión 3 · Decisiones', () => {
  it('Solución · S3 · hay al menos 3 decisiones registradas, numeradas sin saltos', () => {
    const numeros = adrs().map((f) => Number(f.slice(0, 4)));
    expect(numeros.length).toBeGreaterThanOrEqual(3);
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
  });

  it.each(['## Contexto', '## Opciones consideradas', '## Decisión', '## Consecuencias', '- **Estado:**'])(
    'Solución · S3 · todos los ADR tienen "%s"',
    (seccion) => {
      const sinSeccion = adrs().filter((f) => !leer(f).includes(seccion));
      expect(sinSeccion).toEqual([]);
    },
  );

  it('Solución · S3 · las consecuencias dicen lo que se gana y lo que se paga', () => {
    const incompletos = adrs().filter((f) => !/\*\*Gana:\*\*/.test(leer(f)) || !/\*\*Paga:\*\*/.test(leer(f)));
    expect(incompletos).toEqual([]);
  });

  it('Solución · S3 · el índice docs/adr/README.md lista todos los ADR', () => {
    const indice = leer('README.md');
    const faltan = adrs().filter((f) => !indice.includes(`(${f})`));
    expect(faltan).toEqual([]);
  });

  it('Solución · S3 · la evaluación ATAM ligera tiene árbol de utilidad, trade-offs y riesgos', () => {
    const atam = fs.readFileSync(path.join(RAIZ, 'docs', 'atam-ligero.md'), 'utf8');
    for (const parte of ['## 2. Árbol de utilidad', 'Puntos de sensibilidad', 'Puntos de compromiso', '**Riesgos:**']) {
      expect(atam).toContain(parte);
    }
  });
});
