// SESIÓN 5 · Diseño orientado al dominio — las soluciones
import * as fs from 'node:fs';
import * as path from 'node:path';
import { InscripcionDeGestion } from '../../src/inscripciones/dominio/inscripcion-de-gestion';
import { Paralelo } from '../../src/inscripciones/dominio/paralelo';
import { ReglaIncumplida } from '../../src/inscripciones/dominio/regla-incumplida';
import { archivosTs, fuente, RAIZ } from '../ayudas/entorno';

// --- datos de ejemplo, en memoria ---
const paralelo = (id: string, sigla: string, cupo: number, dia = 'LU', inicio = '07:00', fin = '08:30') =>
  Paralelo.desde({ id, sigla, grupo: id.slice(-1), docente: 'Ing. Prueba', cupo, horarios: [{ dia, inicio, fin }] });
const materia = (sigla: string, creditos: number, prerrequisitos: string[] = []) => ({ sigla, nombre: sigla, creditos, prerrequisitos });

function crear(elecciones: any[], inscritos: Record<string, number> = {}, aprobadas: string[] = []) {
  return InscripcionDeGestion.crear({
    id: 'INS-1', estudianteId: 'E-1', codigo: '2023-1001', gestion: '2027-1', fecha: '2027-01-20T00:00:00.000Z',
    elecciones, inscritosPorParalelo: new Map(Object.entries(inscritos)), siglasAprobadas: aprobadas,
  });
}
function errorDe(fn: () => unknown): ReglaIncumplida {
  try {
    fn();
  } catch (e) {
    if (e instanceof ReglaIncumplida) return e;
    throw e;
  }
  throw new Error('no lanzó ReglaIncumplida');
}

describe('Sesión 5 · Dominio', () => {
  it('Solución · S5 · el dominio es TypeScript puro: no importa Nest, ni node:, ni nada fuera de dominio/', () => {
    const dominio = archivosTs('src/inscripciones/dominio');
    expect(dominio.length).toBeGreaterThanOrEqual(5);
    for (const archivo of dominio) {
      const imports = [...fuente(archivo).matchAll(/from '([^']+)'/g)].map((m) => m[1]);
      expect({ archivo, ajenos: imports.filter((i) => !i.startsWith('./')) }).toEqual({ archivo, ajenos: [] });
    }
  });

  it('Solución · S5 · la regla del cupo vive en un solo lugar: Paralelo', () => {
    const conCupo = archivosTs('src').filter((f) => /\.cupo\b/.test(fuente(f)));
    expect(conCupo).toEqual(['src/inscripciones/dominio/paralelo.ts']);
    const ing = paralelo('ING-101-A', 'ING-101', 2);
    expect(ing.disponibles(1)).toBe(1);
    expect(ing.disponibles(3)).toBe(0);
    expect(errorDe(() => ing.verificarQueHayCupo(2))).toMatchObject({ tipo: 'conflicto', message: 'Ya no hay cupo en ING-101-A' });
  });

  it('Solución · S5 · el agregado protege el reglamento: créditos, cupo, choques y prerrequisitos', () => {
    const sis211 = { paralelo: paralelo('SIS-211-A', 'SIS-211', 25), materia: materia('SIS-211', 5, ['SIS-112']) };
    const sis221 = { paralelo: paralelo('SIS-221-A', 'SIS-221', 25, 'LU', '07:30', '09:00'), materia: materia('SIS-221', 5) };
    const grande = { paralelo: paralelo('X-1-A', 'X-1', 25, 'SA'), materia: materia('X-1', 20) };

    expect(errorDe(() => crear([sis211, { ...sis211 }])).message).toBe('Elegiste dos paralelos de SIS-211');
    expect(errorDe(() => crear([sis221, grande])).message).toBe('Máximo 24 créditos por gestión (elegiste 25)');
    expect(errorDe(() => crear([sis221], { 'SIS-221-A': 25 })).tipo).toBe('conflicto');
    expect(errorDe(() => crear([sis211, sis221], {}, ['SIS112'])).message).toMatch(/Choque de horario/);
    expect(errorDe(() => crear([sis211])).message).toBe('Te falta aprobar SIS-112 para inscribirte a SIS-211');

    const ok = crear([sis211], {}, ['SIS112']);
    expect(ok.aDatos()).toMatchObject({ paralelos: ['SIS-211-A'], creditos: 5, estado: 'PENDIENTE_PAGO' });
    ok.registrarPago('QR-1', 1350);
    expect(ok.aDatos()).toMatchObject({ estado: 'PAGADA', pagoId: 'QR-1', monto: 1350 });
  });

  it('Solución · S5 · el retiro también pasa por el agregado: nunca se queda sin materias', () => {
    const datos = { id: 'INS-1', estudianteId: 'E-1', codigo: 'x', gestion: '2027-1', paralelos: ['A', 'B'], creditos: 8,
      monto: 1920, pagoId: 'QR-1', estado: 'PAGADA' as const, fecha: 'x' };
    const inscripcion = InscripcionDeGestion.desde(datos);
    expect(errorDe(() => inscripcion.retirar('Z', 3)).message).toBe('No estás inscrito en Z');
    inscripcion.retirar('A', 3);
    expect(inscripcion.aDatos()).toMatchObject({ paralelos: ['B'], creditos: 5 });
    expect(errorDe(() => inscripcion.retirar('B', 5)).message).toBe('No puedes retirar tu última materia');
    expect(datos.paralelos).toEqual(['A', 'B']); // desde() copia: nadie cambia el agregado desde afuera
  });

  it('Solución · S5 · un solo nombre por concepto, escrito en el lenguaje ubicuo y el mapa de contextos', () => {
    expect(archivosTs('src').filter((f) => /const grupos\b/.test(fuente(f)))).toEqual([]);
    const glosario = fs.readFileSync(path.join(RAIZ, 'docs/dominio/lenguaje-ubicuo.md'), 'utf8');
    for (const termino of ['**Gestión**', '**Paralelo**', '**Grupo**', '**Cupo**', '**Inscripción de gestión**']) {
      expect(glosario).toContain(termino);
    }
    const mapa = fs.readFileSync(path.join(RAIZ, 'docs/dominio/mapa-de-contextos.md'), 'utf8');
    expect(mapa).toContain('```mermaid');
    expect(mapa.match(/^\| \*\*[^*]+\*\* \|/gm)).toHaveLength(7);
  });
});
