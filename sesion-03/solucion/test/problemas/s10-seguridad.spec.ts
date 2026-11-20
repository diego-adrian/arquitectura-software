// SESIÓN 10 · Seguridad y resiliencia arquitectónica
import { ANA, CARLA, Entorno, fuente, levantar } from '../ayudas/entorno';

describe('Sesión 10 · Seguridad y resiliencia', () => {
  let e: Entorno;
  afterEach(() => e.cerrar());

  const inscribir = (token: string, cuerpo: object) =>
    e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send(cuerpo);

  describe('fronteras de confianza', () => {
    beforeEach(async () => (e = await levantar()));

    it('Problema · S10 · el servidor cobra el monto que manda el cliente: Bs 1 por 13 créditos', async () => {
      const ana = await e.entrar(ANA);
      const r = await inscribir(ana, { paralelos: ['SIS-211-B', 'SIS-221-A', 'ING-101-A'], monto: 1 }).expect(201);
      expect(r.body).toMatchObject({ creditos: 13, monto: 1 });
    });

    it('Problema · S10 · Carla puede ver la inscripción de Ana (falta controlar al dueño)', async () => {
      const ana = await e.entrar(ANA);
      const creada = await inscribir(ana, { paralelos: ['ING-101-A'] }).expect(201);
      const carla = await e.entrar(CARLA);
      const r = await e.http().get(`/api/inscripciones/${creada.body.id}`).set('authorization', `Bearer ${carla}`).expect(200);
      expect(r.body.codigo).toBe(ANA);
    });

    it('Problema · S10 · un estudiante ve el reporte de la Dirección con lo recaudado (el rol solo se revisa en el frontend)', async () => {
      const ana = await e.entrar(ANA);
      const r = await e.http().get('/api/reportes/ocupacion').set('authorization', `Bearer ${ana}`).expect(200);
      expect(r.body).toHaveProperty('recaudado');
    });

    it('Problema · S10 · las contraseñas se guardan en texto plano', () => {
      expect(e.leerDatos('usuarios.json')[0].password).toBe('demo1234');
      expect(fuente('src/usuarios/usuarios.repositorio.ts')).toContain('u.password === password');
    });
  });

  describe('resiliencia frente a la pasarela', () => {
    it('Problema · S10 · si la pasarela tarda, la inscripción espera sin límite (no hay timeout)', async () => {
      e = await levantar({ pasarela: { latenciaMs: 1500 } });
      const token = await e.entrar(ANA);
      const inicio = Date.now();
      await inscribir(token, { paralelos: ['ING-101-A'] }).expect(201);
      expect(Date.now() - inicio).toBeGreaterThanOrEqual(1400);
    });

    it('Problema · S10 · si la pasarela cae, el estudiante recibe un 500 genérico y no puede inscribirse', async () => {
      e = await levantar({ pasarela: { fallaPorcentaje: 100 } });
      const ana = await e.entrar(ANA);
      const r = await inscribir(ana, { paralelos: ['ING-101-A'] }).expect(500);
      expect(r.body.message).toBe('Internal server error');
    });
  });
});
