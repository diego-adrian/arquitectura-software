// SESIÓN 4 · Deuda técnica — las soluciones
// Las métricas de scripts/metricas.ts se vuelven reglas: si alguien crea un ciclo, el build falla.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { analizar } from '../../scripts/metricas';
import { archivosTs, fuente, prepararDatos, RAIZ } from '../ayudas/entorno';

describe('Sesión 4 · Deuda técnica', () => {
  it('Solución · S4 · no hay ciclos de imports entre archivos', () => {
    expect(analizar().ciclos).toEqual([]);
  });

  it('Solución · S4 · el único ciclo entre módulos que queda es el del inventario (inscripciones ⇄ oferta, Sesión 7)', () => {
    expect(analizar().ciclosDeModulos).toEqual([['inscripciones', 'oferta']]);
  });

  it('Solución · S4 · PagosService se puede cargar primero: el orden de los imports ya no importa', async () => {
    prepararDatos();
    let modulo: any;
    await jest.isolateModulesAsync(async () => {
      require(path.join(RAIZ, 'src/pagos/pagos.service'));
      const { Test } = require('@nestjs/testing');
      const { AppModule } = require(path.join(RAIZ, 'src/app.module'));
      modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    });
    expect(modulo).toBeDefined();
    await modulo.close();
  });

  it('Solución · S4 · la gestión tiene una sola fuente de verdad: oferta.json', () => {
    const conGestionEscrita = archivosTs('src').filter((f) => /GESTION_ACTUAL|'2027-1'/.test(fuente(f)));
    expect(conGestionEscrita).toEqual([]);
    expect(fuente('src/oferta/oferta.repositorio.ts')).toContain('gestionActual()');
  });

  it('Solución · S4 · utils.ts ya no existe: cada función vive junto a quien la usa', () => {
    expect(fs.existsSync(path.join(RAIZ, 'src', 'utils', 'utils.ts'))).toBe(false);
    const masUsado = analizar().masUsados[0];
    expect(masUsado.dependientes).toBeLessThan(9); // utils.ts tenía 9
  });

  it('Solución · S4 · el inventario de deuda existe y cada ítem tiene una sesión asignada', () => {
    const inventario = fs.readFileSync(path.join(RAIZ, 'docs', 'deuda', 'inventario.md'), 'utf8');
    const items = inventario.split('\n').filter((l) => /^\| D\d+ /.test(l));
    expect(items.length).toBeGreaterThanOrEqual(8);
    const sinSesion = items.filter((l) => !/\| S\d+ \|$/.test(l.trim()));
    expect(sinSesion).toEqual([]);
  });
});
