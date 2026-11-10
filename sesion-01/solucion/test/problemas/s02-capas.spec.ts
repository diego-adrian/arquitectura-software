// SESIÓN 2 · Estilos y patrones: de "todo en el controlador" a capas
import { fuente } from '../ayudas/entorno';

describe('Sesión 2 · Estilos y patrones', () => {
  it.each(['oferta/oferta.controller.ts', 'kardex/kardex.controller.ts', 'reportes/reportes.controller.ts'])(
    'Problema · S2 · %s lee los archivos de datos directamente y no tiene un servicio',
    (archivo) => {
      const codigo = fuente(`src/${archivo}`);
      expect(codigo).toContain('leerJson(');
      expect(codigo).not.toMatch(/constructor\(/);
    },
  );

  it('Problema · S2 · el controlador del kardex llama por HTTP al sistema académico', () => {
    expect(fuente('src/kardex/kardex.controller.ts')).toContain('await fetch(');
  });
});
