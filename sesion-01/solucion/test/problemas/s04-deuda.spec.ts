// SESIÓN 4 · Deuda técnica
import { archivosTs, fuente, RAIZ } from '../ayudas/entorno';
import * as path from 'node:path';

describe('Sesión 4 · Deuda técnica', () => {
  it('Problema · S4 · ciclo de dependencias: inscripciones.service importa pagos.service y pagos.service importa inscripciones.service', () => {
    expect(fuente('src/inscripciones/inscripciones.service.ts')).toContain("from '../pagos/pagos.service'");
    expect(fuente('src/pagos/pagos.service.ts')).toContain("from '../inscripciones/inscripciones.service'");
  });

  it('Problema · S4 · por el ciclo, si se carga PagosService primero Nest no puede arrancar', async () => {
    let error: unknown;
    await jest.isolateModulesAsync(async () => {
      require(path.join(RAIZ, 'src/pagos/pagos.service'));
      const { Test } = require('@nestjs/testing');
      const { AppModule } = require(path.join(RAIZ, 'src/app.module'));
      error = await Test.createTestingModule({ imports: [AppModule] })
        .compile()
        .catch((e: unknown) => e);
    });
    expect(String(error)).toMatch(/can't resolve dependencies of the InscripcionesService/);
  });

  it('Problema · S4 · utils.ts es un cajón de sastre del que dependen al menos 8 archivos', () => {
    const dependientes = archivosTs('src').filter((f) => fuente(f).includes("utils/utils'"));
    expect(dependientes.length).toBeGreaterThanOrEqual(8);
  });

  it('Problema · S4 · GESTION_ACTUAL vive dentro de inscripciones.service y otros módulos la importan de ahí', () => {
    const dependientes = archivosTs('src').filter((f) => /import \{[^}]*GESTION_ACTUAL/.test(fuente(f)));
    expect(dependientes.sort()).toEqual(['src/pagos/pagos.service.ts', 'src/reportes/reportes.controller.ts']);
  });
});
