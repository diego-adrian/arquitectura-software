// CONTRATO HTTP DE CUPO
// Lo que el sistema hace para sus usuarios. Estas pruebas tienen que pasar en esta versión y en
// TODAS las siguientes: la arquitectura cambia sesión a sesión, el comportamiento no.
// El contrato solo crece cuando se corrige un error (las pruebas marcadas "desde s01").
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ANA, CARLA, CLAVE, DIEGO, DIRECCION, Entorno, levantar, LUIS } from '../ayudas/entorno';

describe('Contrato HTTP de Cupo', () => {
  let e: Entorno;
  beforeEach(async () => (e = await levantar()));
  afterEach(() => e.cerrar());

  const inscribir = (token: string, paralelos: string[]) =>
    e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos });

  describe('Sesión', () => {
    it('inicia sesión con código y contraseña, y no devuelve la contraseña', async () => {
      const r = await e.http().post('/api/login').send({ codigo: ANA, password: CLAVE }).expect(201);
      expect(typeof r.body.token).toBe('string');
      expect(r.body.usuario).toMatchObject({ codigo: ANA, nombre: 'Ana Quispe', rol: 'estudiante', tipo: 'regular' });
      expect(r.body.usuario.password).toBeUndefined();
    });

    it('rechaza una contraseña incorrecta con 401', async () => {
      await e.http().post('/api/login').send({ codigo: ANA, password: 'otra' }).expect(401);
    });

    it.each([
      ['get', '/api/oferta'],
      ['post', '/api/inscripciones'],
      ['get', '/api/inscripciones/mia'],
      ['get', '/api/kardex'],
      ['get', '/api/reportes/ocupacion'],
    ] as const)('%s %s sin token responde 401', async (metodo, ruta) => {
      await e.http()[metodo](ruta).expect(401);
    });
  });

  describe('Oferta', () => {
    it('lista las 13 materias de la gestión 2027-1 con sus paralelos y cupos', async () => {
      const token = await e.entrar(ANA);
      const r = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      expect(r.body.gestion).toBe('2027-1');
      expect(r.body.materias).toHaveLength(13);
      const ingles = r.body.materias.find((m: any) => m.sigla === 'ING-101');
      expect(ingles).toMatchObject({ nombre: 'Inglés Técnico', creditos: 3 });
      expect(ingles.paralelos[0]).toMatchObject({ id: 'ING-101-A', cupo: 2, inscritos: 0, disponibles: 2 });
    });

    it('publica el máximo de créditos del reglamento: 24 (desde s01)', async () => {
      const token = await e.entrar(ANA);
      const r = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      expect(r.body.maxCreditos).toBe(24);
    });

    it('descuenta el cupo cuando alguien se inscribe', async () => {
      const token = await e.entrar(ANA);
      await inscribir(token, ['ING-101-A']).expect(201);
      const r = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      const ingles = r.body.materias.find((m: any) => m.sigla === 'ING-101');
      expect(ingles.paralelos[0]).toMatchObject({ inscritos: 1, disponibles: 1 });
    });
  });

  describe('Inscripción: el caso feliz', () => {
    it('inscribe, cobra con la pasarela, guarda el pago y envía el correo', async () => {
      const token = await e.entrar(ANA);
      const r = await inscribir(token, ['SIS-211-B', 'SIS-221-A', 'ING-101-A']).expect(201);
      expect(r.body).toMatchObject({
        codigo: ANA,
        gestion: '2027-1',
        paralelos: ['SIS-211-B', 'SIS-221-A', 'ING-101-A'],
        creditos: 13,
        monto: 2870,
        estado: 'PAGADA',
      });
      expect(r.body.pagoId).toMatch(/^QR-/);

      const pagos = e.leerDatos('pagos.json');
      expect(pagos).toEqual([expect.objectContaining({ id: r.body.pagoId, monto: 2870, estado: 'APROBADO' })]);
      const correos = fs.readFileSync(path.join(e.datos, 'correos.log'), 'utf8');
      expect(correos).toContain('ana.quispe@estudiantes.cupo.test');
      expect(correos).toContain('Bs 2870.00');
    });

    // Matrícula Bs 400 + Bs 190 por crédito, con descuento o recargo según el tipo de estudiante
    it.each([
      ['regular', ANA, ['SIS-211-B', 'SIS-221-A', 'ING-101-A'], 13, 2870],
      ['becado (50 % en créditos)', LUIS, ['SIS-112-A', 'FHC-101-A'], 8, 1160],
      ['convenio (30 % en créditos)', CARLA, ['SIS-311-A', 'SIS-321-A'], 8, 1464],
      ['traspaso (recargo Bs 250)', DIEGO, ['FHC-101-A', 'ING-101-A'], 6, 1790],
    ])('calcula el monto de un estudiante %s', async (_tipo, codigo, paralelos, creditos, monto) => {
      const token = await e.entrar(codigo);
      const r = await inscribir(token, paralelos).expect(201);
      expect(r.body).toMatchObject({ creditos, monto });
    });

    it('acepta exactamente 24 créditos', async () => {
      const token = await e.entrar(ANA);
      const r = await inscribir(token, ['SIS-211-B', 'SIS-221-A', 'SIS-231-A', 'FIS-101-A', 'EST-201-A']).expect(201);
      expect(r.body.creditos).toBe(24);
    });
  });

  describe('Inscripción: lo que se rechaza', () => {
    it('sin paralelos: 400', async () => {
      const token = await e.entrar(ANA);
      await inscribir(token, []).expect(400);
    });

    it('un paralelo que no existe: 400', async () => {
      const token = await e.entrar(ANA);
      const r = await inscribir(token, ['XYZ-999-A']).expect(400);
      expect(r.body.message).toContain('XYZ-999-A');
    });

    it('dos paralelos de la misma materia: 400', async () => {
      const token = await e.entrar(ANA);
      await inscribir(token, ['SIS-211-A', 'SIS-211-B']).expect(400);
    });

    it('más de 24 créditos: 400', async () => {
      const token = await e.entrar(ANA);
      const r = await inscribir(token, ['SIS-211-B', 'SIS-221-A', 'SIS-231-A', 'FIS-101-A', 'EST-201-A', 'ING-101-A']).expect(400);
      expect(r.body.message).toMatch(/24 créditos/);
    });

    it('choque de horario: 400', async () => {
      const token = await e.entrar(ANA);
      const r = await inscribir(token, ['SIS-211-A', 'SIS-221-A']).expect(400);
      expect(r.body.message).toMatch(/choque de horario/i);
    });

    it('sin el prerrequisito aprobado: 400 (desde s01)', async () => {
      const token = await e.entrar(LUIS);
      const r = await inscribir(token, ['SIS-211-B']).expect(400);
      expect(r.body.message).toBe('Te falta aprobar SIS-112 para inscribirte a SIS-211');
    });

    it('paralelo sin cupo: 409', async () => {
      await inscribir(await e.entrar(ANA), ['ING-101-A']).expect(201);
      await inscribir(await e.entrar(CARLA), ['ING-101-A']).expect(201);
      const r = await inscribir(await e.entrar(LUIS), ['ING-101-A']).expect(409);
      expect(r.body.message).toMatch(/cupo/);
    });

    it('una segunda inscripción en la misma gestión: 409', async () => {
      const token = await e.entrar(ANA);
      await inscribir(token, ['ING-101-A']).expect(201);
      await inscribir(token, ['EST-201-A']).expect(409);
    });

    it('la Dirección de Carrera no se inscribe: 403', async () => {
      await inscribir(await e.entrar(DIRECCION), ['ING-101-A']).expect(403);
    });
  });

  describe('Mi inscripción y retiros', () => {
    it('GET /mia responde 404 antes de inscribirse y la inscripción después', async () => {
      const token = await e.entrar(ANA);
      await e.http().get('/api/inscripciones/mia').set('authorization', `Bearer ${token}`).expect(404);
      const creada = await inscribir(token, ['ING-101-A', 'EST-201-A']).expect(201);
      const r = await e.http().get('/api/inscripciones/mia').set('authorization', `Bearer ${token}`).expect(200);
      expect(r.body.id).toBe(creada.body.id);
      await e.http().get(`/api/inscripciones/${creada.body.id}`).set('authorization', `Bearer ${token}`).expect(200);
    });

    it('retirar una materia libera el cupo y recalcula los créditos', async () => {
      const token = await e.entrar(ANA);
      const creada = await inscribir(token, ['ING-101-A', 'EST-201-A']).expect(201);
      const r = await e
        .http()
        .delete(`/api/inscripciones/${creada.body.id}/paralelos/ING-101-A`)
        .set('authorization', `Bearer ${token}`)
        .expect(200);
      expect(r.body).toMatchObject({ paralelos: ['EST-201-A'], creditos: 4 });

      const oferta = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      const ingles = oferta.body.materias.find((m: any) => m.sigla === 'ING-101');
      expect(ingles.paralelos[0].disponibles).toBe(2);
    });

    it('no se puede retirar la última materia (400) ni tocar la inscripción de otro (403)', async () => {
      const ana = await e.entrar(ANA);
      const creada = await inscribir(ana, ['ING-101-A']).expect(201);
      await e.http().delete(`/api/inscripciones/${creada.body.id}/paralelos/ING-101-A`).set('authorization', `Bearer ${ana}`).expect(400);
      const carla = await e.entrar(CARLA);
      await e.http().delete(`/api/inscripciones/${creada.body.id}/paralelos/ING-101-A`).set('authorization', `Bearer ${carla}`).expect(403);
    });
  });

  describe('Kardex', () => {
    it('muestra el historial que viene del sistema académico con siglas y estados legibles', async () => {
      const token = await e.entrar(ANA);
      const r = await e.http().get('/api/kardex').set('authorization', `Bearer ${token}`).expect(200);
      expect(r.body.codigo).toBe(ANA);
      expect(r.body.materias).toContainEqual({ sigla: 'SIS-111', nota: 71, estado: 'APROBADA', gestion: '2025-1' });
      expect(r.body.materias).toContainEqual({ sigla: 'SIS-211', nota: 45, estado: 'REPROBADA', gestion: '2026-1' });
    });
  });

  describe('Reporte de ocupación', () => {
    it('la Dirección ve la ocupación de cada paralelo y lo recaudado', async () => {
      await inscribir(await e.entrar(ANA), ['ING-101-A', 'EST-201-A']).expect(201);
      const token = await e.entrar(DIRECCION);
      const r = await e.http().get('/api/reportes/ocupacion').set('authorization', `Bearer ${token}`).expect(200);
      expect(r.body).toMatchObject({ gestion: '2027-1', totalInscritos: 1, recaudado: 1730 });
      expect(r.body.paralelos).toContainEqual(expect.objectContaining({ id: 'ING-101-A', cupo: 2, inscritos: 1, ocupacion: 50 }));
    });
  });
});
