// SESIÓN 5 · Diseño orientado al dominio (DDD estratégico)
import * as fs from 'node:fs';
import * as path from 'node:path';
import { archivosTs, fuente, RAIZ } from '../ayudas/entorno';

describe('Sesión 5 · Dominio', () => {
  it('Problema · S5 · no hay modelo de dominio: Paralelo e Inscripción son objetos sueltos (any) sin reglas propias', () => {
    expect(fs.existsSync(path.join(RAIZ, 'src', 'dominio'))).toBe(false);
    const clases = archivosTs('src').flatMap((f) => fuente(f).match(/class (Paralelo|Inscripcion)\b/g) ?? []);
    expect(clases).toEqual([]);
  });

  it('Problema · S5 · la invariante "inscritos ≤ cupo" se calcula por separado en 3 archivos', () => {
    const conCupo = archivosTs('src').filter((f) => /\.cupo\b/.test(fuente(f)));
    expect(conCupo.sort()).toEqual([
      'src/inscripciones/inscripciones.service.ts',
      'src/oferta/oferta.controller.ts',
      'src/reportes/reportes.controller.ts',
    ]);
  });

  it('Problema · S5 · el mismo concepto tiene dos nombres: "paralelo" en la API y "grupo" en el código de la oferta', () => {
    expect(fuente('src/oferta/oferta.controller.ts')).toMatch(/const grupos = /);
  });
});
