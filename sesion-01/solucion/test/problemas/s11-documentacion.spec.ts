// SESIÓN 11 · Documentar y evaluar arquitecturas
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RAIZ } from '../ayudas/entorno';

describe('Sesión 11 · Documentación y fitness functions', () => {
  it('Problema · S11 · no hay diagramas C4 ni pruebas que hagan cumplir la arquitectura', () => {
    expect(fs.existsSync(path.join(RAIZ, 'docs', 'c4'))).toBe(false);
    expect(fs.existsSync(path.join(RAIZ, 'test', 'arquitectura'))).toBe(false);
  });
});
