// SESIÓN 1 · KISS, DRY y SOLID
// Cada prueba PASA PORQUE EL DEFECTO EXISTE. Cuando lo arreglas en la sesión, la prueba falla:
// esa es la señal de que el problema ya no está.
//
// Los módulos de src/ se cargan con require() DENTRO de cada prueba: así, cuando un paso
// mueve o borra un archivo, falla solo la prueba de ese problema y no todo el archivo.
import { Test } from '@nestjs/testing';
import { ANA, archivosTs, Entorno, fuente, levantar, lineasDelMetodo, LUIS, prepararDatos } from '../ayudas/entorno';

const src = (ruta: string) => require(`../../src/${ruta}`);

describe('Sesión 1 · KISS, DRY y SOLID', () => {
  describe('con el sistema corriendo', () => {
    let e: Entorno;
    beforeEach(async () => (e = await levantar()));
    afterEach(() => e.cerrar());

    it('Problema · S1 · LSP · Luis se inscribe a SIS-211 sin haber aprobado SIS-112 (los prerrequisitos no bloquean)', async () => {
      const token = await e.entrar(LUIS);
      await e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['SIS-211-B'] }).expect(201);
    });

    it('Problema · S1 · DRY · la oferta anuncia un máximo de 22 créditos, pero el servidor acepta 24', async () => {
      const token = await e.entrar(ANA);
      const oferta = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      expect(oferta.body.maxCreditos).toBe(22);
      const r = await e
        .http()
        .post('/api/inscripciones')
        .set('authorization', `Bearer ${token}`)
        .send({ paralelos: ['SIS-211-B', 'SIS-221-A', 'SIS-231-A', 'FIS-101-A', 'EST-201-A'] })
        .expect(201);
      expect(r.body.creditos).toBe(24);
    });
  });

  it('Problema · S1 · LSP · ReglaPrerrequisitos devuelve una promesa donde la clase base promete un texto o null', () => {
    const { ReglaPrerrequisitos } = src('inscripciones/motor-reglas');
    const resultado = new ReglaPrerrequisitos().validar({ estudiante: { codigo: LUIS }, paralelos: [], materias: [] });
    expect(resultado).toBeInstanceOf(Promise);
    return resultado;
  });

  it('Problema · S1 · KISS · las reglas se piden por nombre en texto: un error de tipeo recién explota en ejecución', () => {
    const { MotorDeReglas } = src('inscripciones/motor-reglas');
    const motor = new MotorDeReglas(['choque-horraio']);
    expect(() => motor.evaluar({ estudiante: {}, paralelos: [], materias: [] })).toThrow('Regla desconocida: choque-horraio');
  });

  it('Problema · S1 · DRY · la verificación de la sesión está copiada en 7 handlers', () => {
    const copias = archivosTs('src')
      .filter((f) => f.endsWith('.controller.ts'))
      .map((f) => (fuente(f).match(/SESIONES\.(get|has)\(/g) ?? []).length)
      .reduce((a, b) => a + b, 0);
    expect(copias).toBe(7);
  });

  it('Problema · S1 · OCP · calcularMonto tiene una rama por tipo: un tipo nuevo ("intercambio") se cobra como regular sin avisar', () => {
    expect(fuente('src/inscripciones/inscripciones.service.ts').match(/tipo === '/g)).toHaveLength(4);
    const { InscripcionesService } = src('inscripciones/inscripciones.service');
    const servicio = new InscripcionesService({});
    expect(servicio.calcularMonto('intercambio', 10)).toBe(servicio.calcularMonto('regular', 10));
  });

  it('Problema · S1 · ISP · CorreoInstitucional debe implementar 6 métodos y 5 solo lanzan "No implementado"', async () => {
    const { CorreoInstitucional } = src('notificaciones/notificador');
    const correo = new CorreoInstitucional();
    const intentos = [
      correo.enviarSms('70000000', 'hola'),
      correo.enviarPush('E-1001', 'hola'),
      correo.enviarMasivo([], 'a', 'b'),
      correo.programar(new Date(), 'a', 'b', 'c'),
      correo.cancelarProgramado('x'),
    ];
    for (const intento of intentos) {
      await expect(intento).rejects.toThrow('No implementado');
    }
  });

  it('Problema · S1 · DIP · InscripcionesService no se puede probar sin la pasarela real: no hay nada que reemplazar', async () => {
    prepararDatos();
    process.env.PASARELA_URL = 'http://127.0.0.1:9'; // puerto donde no hay nadie
    process.env.LEGADO_URL = 'http://127.0.0.1:9';
    const { InscripcionesService } = src('inscripciones/inscripciones.service');
    const { PagosService } = src('pagos/pagos.service');
    const modulo = await Test.createTestingModule({ providers: [InscripcionesService, PagosService] }).compile();
    expect(() => modulo.get('PASARELA')).toThrow();
    await expect(modulo.get(InscripcionesService).inscribir('E-1001', { paralelos: ['ING-101-A'] })).rejects.toThrow('fetch failed');
  });

  it('Problema · S1 · SRP · inscribir() mide más de 100 líneas y tiene 12 responsabilidades numeradas', () => {
    const codigo = fuente('src/inscripciones/inscripciones.service.ts');
    expect(lineasDelMetodo(codigo, 'async inscribir(')).toBeGreaterThan(100);
    const cuerpo = codigo.slice(codigo.indexOf('async inscribir('), codigo.indexOf('calcularMonto(tipo'));
    expect(cuerpo.match(/\/\/ \d+\./g)).toHaveLength(12);
  });
});
