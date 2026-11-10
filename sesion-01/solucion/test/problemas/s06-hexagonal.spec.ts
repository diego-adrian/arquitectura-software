// SESIÓN 6 · Modularidad y límites (arquitectura hexagonal)
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { fuente, prepararDatos } from '../ayudas/entorno';

describe('Sesión 6 · Hexagonal', () => {
  it('Problema · S6 · el periodo de inscripción depende del reloj real (new Date()) y no hay un RELOJ que se pueda reemplazar', async () => {
    expect(fuente('src/inscripciones/inscripciones.service.ts')).toContain('const hoy = new Date();');
    prepararDatos();
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(() => modulo.get('RELOJ')).toThrow();
  });

  it('Problema · S6 · la lógica de inscripción lee y escribe el archivo JSON directamente (leerJson/escribirJson)', () => {
    const codigo = fuente('src/inscripciones/inscripciones.service.ts');
    expect(codigo).toMatch(/import \{[^}]*escribirJson[^}]*\} from '..\/utils\/utils'/);
    expect(codigo.match(/leerJson\('/g)!.length).toBeGreaterThanOrEqual(6);
  });
});
