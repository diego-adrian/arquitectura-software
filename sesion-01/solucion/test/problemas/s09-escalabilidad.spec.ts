// SESIÓN 9 · Escalabilidad y rendimiento
import request from 'supertest';
import { ANA, CARLA, CLAVE, crearApp, Entorno, levantar } from '../ayudas/entorno';

describe('Sesión 9 · Escalabilidad', () => {
  let e: Entorno;
  afterEach(() => e.cerrar());

  it('Problema · S9 · sobrecupo: con un solo cupo, dos inscripciones simultáneas entran las dos', async () => {
    e = await levantar({
      pasarela: { latenciaMs: 100 },
      ajustarOferta: (oferta) => (oferta.paralelos.find((p: any) => p.id === 'ING-101-A').cupo = 1),
    });
    const [ana, carla] = await Promise.all([e.entrar(ANA), e.entrar(CARLA)]);
    const enviar = (token: string) =>
      e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['ING-101-A'] });

    const respuestas = await Promise.all([enviar(ana), enviar(carla)]);
    expect(respuestas.map((r) => r.status)).toEqual([201, 201]);
    const inscritos = e.leerDatos('inscripciones.json').filter((i: any) => i.paralelos.includes('ING-101-A'));
    expect(inscritos).toHaveLength(2); // cupo: 1
  });

  it('Problema · S9 · las sesiones viven en la memoria del proceso: el token de la instancia A no sirve en la instancia B', async () => {
    e = await levantar();
    let instanciaB: any;
    await jest.isolateModulesAsync(async () => {
      instanciaB = await crearApp(require);
    });

    const login = await request(e.app.getHttpServer()).post('/api/login').send({ codigo: ANA, password: CLAVE }).expect(201);
    await request(e.app.getHttpServer()).get('/api/oferta').set('authorization', `Bearer ${login.body.token}`).expect(200);
    await request(instanciaB.getHttpServer()).get('/api/oferta').set('authorization', `Bearer ${login.body.token}`).expect(401);
    await instanciaB.close();
  });
});
