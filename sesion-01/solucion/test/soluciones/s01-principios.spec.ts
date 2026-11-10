// SESIÓN 1 · KISS, DRY y SOLID — las soluciones
// Cada prueba demuestra que un problema de test/problemas/s01 (versión s00) ya no está.
import { Test } from '@nestjs/testing';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Arancel, ARANCELES, ARANCELES_VIGENTES } from '../../src/inscripciones/aranceles';
import { correoDeConfirmacion } from '../../src/inscripciones/correo-de-confirmacion';
import { InscripcionesService } from '../../src/inscripciones/inscripciones.service';
import { LECTOR_KARDEX, LectorKardex } from '../../src/inscripciones/lector-kardex';
import {
  buscarChoqueDeHorario,
  MAX_CREDITOS,
  verificarCreditos,
  verificarPrerrequisitos,
} from '../../src/inscripciones/reglas-de-inscripcion';
import { NOTIFICADOR, Notificador } from '../../src/notificaciones/notificador';
import { PagosService } from '../../src/pagos/pagos.service';
import { PASARELA, PasarelaPago } from '../../src/pagos/pasarela';
import { ANA, archivosTs, Entorno, fuente, levantar, lineasDelMetodo, LUIS, prepararDatos, RAIZ } from '../ayudas/entorno';

// --- Dobles de prueba: implementaciones falsas de las abstracciones ---

class PasarelaFalsa implements PasarelaPago {
  cobrados: number[] = [];
  async cobrar(monto: number) {
    this.cobrados.push(monto);
    return { id: 'QR-falso', estado: 'APROBADO', monto };
  }
}

class NotificadorFalso implements Notificador {
  enviados: string[] = [];
  async enviar(para: string) {
    this.enviados.push(para);
  }
}

class KardexFalso implements LectorKardex {
  constructor(private readonly aprobadas: string[]) {}
  async siglasAprobadas() {
    return this.aprobadas;
  }
}

/** Arma InscripcionesService con dobles: sin pasarela, legado ni correo reales. */
async function servicioConDobles(aranceles: Arancel[] = ARANCELES_VIGENTES) {
  const pasarela = new PasarelaFalsa();
  const notificador = new NotificadorFalso();
  const modulo = await Test.createTestingModule({
    providers: [
      InscripcionesService,
      PagosService,
      { provide: PASARELA, useValue: pasarela },
      { provide: NOTIFICADOR, useValue: notificador },
      { provide: LECTOR_KARDEX, useValue: new KardexFalso(['SIS111', 'MAT101', 'SIS112', 'MAT102']) },
      { provide: ARANCELES, useValue: aranceles },
    ],
  }).compile();
  return { servicio: modulo.get(InscripcionesService), pasarela, notificador };
}

/** Cambia el tipo de un estudiante en los datos temporales de la prueba. */
function cambiarTipo(datos: string, id: string, tipo: string) {
  const ruta = path.join(datos, 'usuarios.json');
  const usuarios = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  usuarios.find((u: any) => u.id === id).tipo = tipo;
  fs.writeFileSync(ruta, JSON.stringify(usuarios));
}

describe('Sesión 1 · KISS, DRY y SOLID', () => {
  describe('con el sistema corriendo', () => {
    let e: Entorno;
    beforeEach(async () => (e = await levantar()));
    afterEach(() => e.cerrar());

    it('Solución · S1 · LSP · los prerrequisitos bloquean: Luis no entra a SIS-211 sin aprobar SIS-112', async () => {
      const token = await e.entrar(LUIS);
      const r = await e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['SIS-211-B'] }).expect(400);
      expect(r.body.message).toBe('Te falta aprobar SIS-112 para inscribirte a SIS-211');
    });

    it('Solución · S1 · LSP · y Luis sí entra a SIS-112, porque aprobó SIS-111 (con 51)', async () => {
      const token = await e.entrar(LUIS);
      await e.http().post('/api/inscripciones').set('authorization', `Bearer ${token}`).send({ paralelos: ['SIS-112-A'] }).expect(201);
    });

    it('Solución · S1 · DRY · la oferta publica el mismo máximo que aplica el servidor', async () => {
      const token = await e.entrar(ANA);
      const oferta = await e.http().get('/api/oferta').set('authorization', `Bearer ${token}`).expect(200);
      expect(oferta.body.maxCreditos).toBe(MAX_CREDITOS);
      expect(fuente('public/app.js')).not.toMatch(/MAX_CREDITOS\s*=/);
    });
  });

  it('Solución · S1 · KISS · las reglas son funciones simples que se prueban con datos en memoria', () => {
    expect(fs.existsSync(path.join(RAIZ, 'src/inscripciones/motor-reglas.ts'))).toBe(false);

    const lunes = (inicio: string, fin: string) => [{ dia: 'LU', inicio, fin }];
    expect(buscarChoqueDeHorario([{ id: 'A', horarios: lunes('07:00', '08:30') }, { id: 'B', horarios: lunes('08:00', '09:30') }])).toBe(
      'Choque de horario entre A y B (LU)',
    );
    expect(buscarChoqueDeHorario([{ id: 'A', horarios: lunes('07:00', '08:30') }, { id: 'B', horarios: lunes('08:30', '10:00') }])).toBeNull();
    expect(verificarCreditos(24)).toBeNull();
    expect(verificarCreditos(25)).toBe('Máximo 24 créditos por gestión (elegiste 25)');
    expect(verificarPrerrequisitos([{ sigla: 'SIS-211', prerrequisitos: ['SIS-112'] }], ['SIS111'])).toBe(
      'Te falta aprobar SIS-112 para inscribirte a SIS-211',
    );
  });

  it('Solución · S1 · DRY · la sesión se verifica en un solo lugar: SesionGuard', () => {
    const verificaciones = archivosTs('src').filter((f) => /SESIONES\.(get|has)\(/.test(fuente(f)));
    expect(verificaciones).toEqual(['src/auth/sesion.guard.ts']);
    const protegidos = archivosTs('src').filter((f) => f.endsWith('.controller.ts') && fuente(f).includes('@UseGuards(SesionGuard)'));
    expect(protegidos.sort()).toEqual([
      'src/inscripciones/inscripciones.controller.ts',
      'src/kardex/kardex.controller.ts',
      'src/oferta/oferta.controller.ts',
      'src/reportes/reportes.controller.ts',
    ]);
  });

  it('Solución · S1 · OCP · un tipo nuevo ("intercambio") se agrega con una clase, sin tocar InscripcionesService', async () => {
    class ArancelIntercambio implements Arancel {
      readonly tipo = 'intercambio';
      calcular(creditos: number) {
        return creditos * 100;
      }
    }
    const datos = prepararDatos();
    cambiarTipo(datos, 'E-1001', 'intercambio');
    const { servicio } = await servicioConDobles([...ARANCELES_VIGENTES, new ArancelIntercambio()]);

    const inscripcion = await servicio.inscribir('E-1001', { paralelos: ['ING-101-A'] });
    expect(inscripcion.monto).toBe(300);
    expect(fuente('src/inscripciones/inscripciones.service.ts')).not.toContain("tipo === '");
  });

  it('Solución · S1 · OCP · un tipo sin arancel ya no se cobra como regular: falla y lo dice', async () => {
    const datos = prepararDatos();
    cambiarTipo(datos, 'E-1001', 'intercambio');
    const { servicio, pasarela } = await servicioConDobles();
    await expect(servicio.inscribir('E-1001', { paralelos: ['ING-101-A'] })).rejects.toThrow('No hay arancel para el tipo de estudiante "intercambio"');
    expect(pasarela.cobrados).toEqual([]);
  });

  it('Solución · S1 · ISP · Notificador pide un solo método: un doble de prueba cabe en una línea', () => {
    const doble: Notificador = { enviar: async () => undefined };
    expect(Object.keys(doble)).toEqual(['enviar']);
    expect(fuente('src/notificaciones/correo-institucional.ts')).not.toContain('No implementado');
  });

  it('Solución · S1 · DIP · InscripcionesService se prueba con dobles: sin pasarela, legado ni correo reales', async () => {
    prepararDatos();
    process.env.PASARELA_URL = 'http://127.0.0.1:9'; // si alguien la usara, fallaría
    process.env.LEGADO_URL = 'http://127.0.0.1:9';
    const { servicio, pasarela, notificador } = await servicioConDobles();

    const inscripcion = await servicio.inscribir('E-1001', { paralelos: ['ING-101-A'] });
    expect(inscripcion).toMatchObject({ creditos: 3, monto: 970, pagoId: 'QR-falso', estado: 'PAGADA' });
    expect(pasarela.cobrados).toEqual([970]);
    expect(notificador.enviados).toEqual(['ana.quispe@estudiantes.cupo.test']);
  });

  it('Solución · S1 · SRP · inscribir() solo orquesta (menos de 45 líneas) y el correo lo arma una función pura', () => {
    const codigo = fuente('src/inscripciones/inscripciones.service.ts');
    expect(lineasDelMetodo(codigo, 'async inscribir(')).toBeLessThan(45);

    const correo = correoDeConfirmacion({
      estudiante: { nombre: 'Ana Quispe' },
      paralelos: [{ sigla: 'ING-101', grupo: 'A' }],
      materias: [{ sigla: 'ING-101', nombre: 'Inglés Técnico' }],
      creditos: 3,
      monto: 970,
      gestion: '2027-1',
    });
    expect(correo.asunto).toBe('Inscripción confirmada 2027-1');
    expect(correo.cuerpo).toContain('- ING-101 Inglés Técnico (grupo A)');
    expect(correo.cuerpo).toContain('Monto pagado: Bs 970.00');
  });
});
