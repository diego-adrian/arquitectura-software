// SESIÓN 7 · Refactorización hacia mejor arquitectura (Strangler Fig y Anticorruption Layer)
import { archivosTs, DIEGO, Entorno, fuente, levantar } from '../ayudas/entorno';

describe('Sesión 7 · El sistema legado', () => {
  let e: Entorno;
  beforeEach(async () => (e = await levantar()));
  afterEach(() => e.cerrar());

  it('Problema · S7 · el estado "CONV" (convalidada) del sistema legado llega crudo a la API', async () => {
    const token = await e.entrar(DIEGO);
    const r = await e.http().get('/api/kardex').set('authorization', `Bearer ${token}`).expect(200);
    expect(r.body.materias.map((m: any) => m.estado)).toEqual(['CONV', 'CONV']);
  });

  it('Problema · S7 · las siglas del legado se traducen de dos formas distintas, en archivos distintos', () => {
    const conGuion = archivosTs('src').filter((f) => fuente(f).includes(".slice(0, 3) + '-' + "));
    const sinGuion = archivosTs('src').filter((f) => /\.replace\('-', ''\)\)/.test(fuente(f)) && fuente(f).includes('prerrequisitos'));
    expect(conGuion).toEqual(['src/kardex/kardex.controller.ts']);
    expect(sinGuion).toHaveLength(1);
    expect(sinGuion).not.toEqual(conGuion);
  });

  it('Problema · S7 · Diego (traspaso) convalidó SIS-111, pero el legado dice "CONV" y no lo dejan inscribirse a SIS-112', async () => {
    const token = await e.entrar(DIEGO);
    const r = await e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['SIS-112-A'] }).expect(400);
    expect(r.body.message).toBe('Te falta aprobar SIS-111 para inscribirte a SIS-112');
  });
});
