// SESIÓN 3 · Decisiones arquitectónicas y trade-offs
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RAIZ } from '../ayudas/entorno';

describe('Sesión 3 · Decisiones arquitectónicas', () => {
  it('Problema · S3 · ninguna decisión está registrada: no existe docs/adr', () => {
    expect(fs.existsSync(path.join(RAIZ, 'docs', 'adr'))).toBe(false);
  });
});
