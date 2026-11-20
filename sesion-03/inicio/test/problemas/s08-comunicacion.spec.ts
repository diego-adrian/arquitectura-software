// SESIÓN 8 · Comunicación entre componentes
import { ANA, Entorno, levantar } from '../ayudas/entorno';

describe('Sesión 8 · Comunicación', () => {
  let e: Entorno;
  beforeEach(async () => (e = await levantar()));
  afterEach(async () => {
    delete process.env.CORREO_FALLA;
    await e.cerrar();
  });

  it('Problema · S8 · si el correo falla, el estudiante recibe 500 aunque ya se le cobró y quedó inscrito', async () => {
    process.env.CORREO_FALLA = 'true';
    const token = await e.entrar(ANA);
    await e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['ING-101-A'] }).expect(500);

    const mia = await e.http().get('/api/inscripciones/mia').set('authorization', `Bearer ${token}`).expect(200);
    expect(mia.body.estado).toBe('PAGADA');
    const cobros = await (await fetch(`${e.urlPasarela}/cobros`)).json();
    expect(cobros).toHaveLength(1);
  });
});
