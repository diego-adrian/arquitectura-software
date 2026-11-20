// SESIÓN 2 · Estilos y patrones — las soluciones
// Reglas de la arquitectura por capas, verificadas sobre el código:
//   presentación (*.controller.ts) → negocio (*.service.ts) → datos (*.repositorio.ts, *.client.ts)
import * as fs from 'node:fs';
import * as path from 'node:path';
import { archivosTs, fuente, RAIZ } from '../ayudas/entorno';

const capa = (f: string) =>
  f.endsWith('.controller.ts') ? 'presentacion' : f.endsWith('.service.ts') ? 'negocio' : /\.(repositorio|client)\.ts$/.test(f) ? 'datos' : 'otra';

/** Los archivos de src/ que importa un archivo (solo imports relativos). */
function importsDe(archivo: string): string[] {
  return [...fuente(archivo).matchAll(/from '(\.[^']+)'/g)].map((m) =>
    path.join(path.dirname(archivo), m[1]).replace(/\\/g, '/') + '.ts',
  );
}

describe('Sesión 2 · Capas', () => {
  it('Solución · S2 · los controladores solo reciben y delegan: no leen archivos ni llaman por HTTP', () => {
    const controladores = archivosTs('src').filter((f) => capa(f) === 'presentacion');
    expect(controladores).toHaveLength(5);
    for (const c of controladores) {
      expect({ archivo: c, leeArchivos: /leerJson|escribirJson/.test(fuente(c)), llamaHttp: fuente(c).includes('fetch(') }).toEqual({
        archivo: c,
        leeArchivos: false,
        llamaHttp: false,
      });
      expect(fuente(c)).toMatch(/constructor\(private readonly servicio: \w+Service\)/);
    }
  });

  it('Solución · S2 · solo la capa de datos toca los archivos JSON y los sistemas externos', () => {
    const tocanDatos = archivosTs('src').filter((f) => /leerJson\(|escribirJson\(|fetch\(/.test(fuente(f)) && !f.endsWith('utils.ts'));
    expect(tocanDatos.map(capa)).toEqual(tocanDatos.map(() => 'datos'));
  });

  it('Solución · S2 · cada capa depende solo de la de abajo: presentación → negocio → datos', () => {
    const prohibido: Record<string, string[]> = { presentacion: ['datos'], negocio: ['presentacion'], datos: ['presentacion', 'negocio'] };
    const violaciones = archivosTs('src').flatMap((f) =>
      importsDe(f)
        .filter((d) => (prohibido[capa(f)] ?? []).includes(capa(d)))
        .map((d) => `${f} → ${d}`),
    );
    expect(violaciones).toEqual([]);
  });

  it('Solución · S2 · la elección de estilo quedó escrita: matriz de 3 escenarios en docs/', () => {
    const matriz = fs.readFileSync(path.join(RAIZ, 'docs', 'matriz-de-estilos.md'), 'utf8');
    expect(matriz.match(/^## Escenario [ABC]/gm)).toHaveLength(3);
    expect(matriz.match(/\*\*Decisión:\*\*/g)).toHaveLength(3);
  });
});
