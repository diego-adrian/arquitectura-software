import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CorreoInstitucional } from '../notificaciones/notificador';
import { PagosService } from '../pagos/pagos.service';
import { ahoraIso, escribirJson, formatoBs, leerJson, nuevoId } from '../utils/utils';
import { MotorDeReglas } from './motor-reglas';

export const GESTION_ACTUAL = '2027-1';
const MATRICULA = 400;
const PRECIO_CREDITO = 190;

@Injectable()
export class InscripcionesService {
  private correo = new CorreoInstitucional();

  constructor(private readonly pagos: PagosService) {}

  async inscribir(estudianteId: string, body: any) {
    // 1. Validar lo que llega
    if (!body || !Array.isArray(body.paralelos) || body.paralelos.length === 0) {
      throw new BadRequestException('Debes elegir al menos un paralelo');
    }
    if (body.paralelos.some((p: any) => typeof p !== 'string')) {
      throw new BadRequestException('Los paralelos deben ser códigos de texto');
    }

    // 2. Buscar al estudiante
    const usuarios = leerJson('usuarios.json');
    const estudiante = usuarios.find((u: any) => u.id === estudianteId);
    if (!estudiante || estudiante.rol !== 'estudiante') {
      throw new ForbiddenException('Solo los estudiantes pueden inscribirse');
    }

    // 3. Revisar el periodo de inscripción
    const oferta = leerJson('oferta.json');
    const hoy = new Date();
    if (hoy < new Date(oferta.periodoInscripcion.inicio) || hoy > new Date(oferta.periodoInscripcion.fin)) {
      throw new BadRequestException('Fuera del periodo de inscripción');
    }

    // 4. Una sola inscripción por gestión
    let inscripciones = leerJson('inscripciones.json');
    if (inscripciones.some((i: any) => i.estudianteId === estudianteId && i.gestion === GESTION_ACTUAL)) {
      throw new ConflictException('Ya tienes una inscripción en esta gestión');
    }

    // 5. Buscar paralelos y materias
    const paralelos: any[] = [];
    const materias: any[] = [];
    for (const id of body.paralelos) {
      const paralelo = oferta.paralelos.find((p: any) => p.id === id);
      if (!paralelo) {
        throw new BadRequestException(`El paralelo ${id} no existe`);
      }
      if (paralelos.some((p) => p.sigla === paralelo.sigla)) {
        throw new BadRequestException(`Elegiste dos paralelos de ${paralelo.sigla}`);
      }
      paralelos.push(paralelo);
      materias.push(oferta.materias.find((m: any) => m.sigla === paralelo.sigla));
    }

    // 6. Límite de créditos
    let creditos = 0;
    for (const materia of materias) {
      creditos += materia.creditos;
    }
    if (creditos > 24) {
      throw new BadRequestException(`Máximo 24 créditos por gestión (elegiste ${creditos})`);
    }

    // 7. Cupos
    for (const paralelo of paralelos) {
      const inscritos = inscripciones.filter(
        (i: any) => i.gestion === GESTION_ACTUAL && i.paralelos.includes(paralelo.id),
      ).length;
      if (inscritos >= paralelo.cupo) {
        throw new ConflictException(`Ya no hay cupo en ${paralelo.id}`);
      }
    }

    // 8. Reglas académicas
    const motor = new MotorDeReglas(['choque-horario', 'prerrequisitos']);
    const errores = motor.evaluar({ estudiante, paralelos, materias });
    if (errores.length > 0) {
      throw new BadRequestException(errores[0]);
    }

    // 9. Monto (la app móvil antigua ya manda el monto calculado)
    let monto = body.monto;
    if (monto === undefined) {
      monto = this.calcularMonto(estudiante.tipo, creditos);
    }

    // 10. Cobrar con la pasarela QR
    const cobro = await this.pagos.cobrar(estudianteId, monto, `Matrícula ${GESTION_ACTUAL} - ${estudiante.codigo}`);

    // 11. Guardar (releemos por si alguien se inscribió mientras cobrábamos)
    const inscripcion = {
      id: nuevoId('INS'),
      estudianteId,
      codigo: estudiante.codigo,
      gestion: GESTION_ACTUAL,
      paralelos: paralelos.map((p) => p.id),
      creditos,
      monto,
      pagoId: cobro.id,
      estado: 'PAGADA',
      fecha: ahoraIso(),
    };
    inscripciones = leerJson('inscripciones.json');
    inscripciones.push(inscripcion);
    escribirJson('inscripciones.json', inscripciones);

    // 12. Avisar por correo
    const detalle = paralelos
      .map((p) => `- ${p.sigla} ${materias.find((m) => m.sigla === p.sigla).nombre} (grupo ${p.grupo})`)
      .join('\n');
    await this.correo.enviarCorreo(
      estudiante.correo,
      `Inscripción confirmada ${GESTION_ACTUAL}`,
      `Hola ${estudiante.nombre}:\n\nTu inscripción quedó registrada.\n${detalle}\n\nCréditos: ${creditos}\nMonto pagado: ${formatoBs(monto)}\n\nCupo · Inscripciones`,
    );

    return inscripcion;
  }

  calcularMonto(tipo: string, creditos: number): number {
    let monto = 0;
    if (tipo === 'regular') {
      monto = MATRICULA + creditos * PRECIO_CREDITO;
    } else if (tipo === 'becado') {
      monto = MATRICULA + creditos * PRECIO_CREDITO * 0.5;
    } else if (tipo === 'convenio') {
      monto = MATRICULA + creditos * PRECIO_CREDITO * 0.7;
    } else if (tipo === 'traspaso') {
      monto = MATRICULA + creditos * PRECIO_CREDITO + 250;
    } else {
      monto = MATRICULA + creditos * PRECIO_CREDITO;
    }
    return Math.round(monto * 100) / 100;
  }

  buscar(id: string) {
    const inscripcion = leerJson('inscripciones.json').find((i: any) => i.id === id);
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    return inscripcion;
  }

  deLaGestion(estudianteId: string) {
    const inscripcion = leerJson('inscripciones.json').find(
      (i: any) => i.estudianteId === estudianteId && i.gestion === GESTION_ACTUAL,
    );
    if (!inscripcion) {
      throw new NotFoundException('Todavía no te inscribiste en esta gestión');
    }
    return inscripcion;
  }

  retirar(estudianteId: string, id: string, paraleloId: string) {
    const inscripciones = leerJson('inscripciones.json');
    const inscripcion = inscripciones.find((i: any) => i.id === id);
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    if (inscripcion.estudianteId !== estudianteId) {
      throw new ForbiddenException('Esta inscripción no es tuya');
    }
    if (!inscripcion.paralelos.includes(paraleloId)) {
      throw new BadRequestException(`No estás inscrito en ${paraleloId}`);
    }
    if (inscripcion.paralelos.length === 1) {
      throw new BadRequestException('No puedes retirar tu última materia');
    }

    const oferta = leerJson('oferta.json');
    inscripcion.paralelos = inscripcion.paralelos.filter((p: string) => p !== paraleloId);
    inscripcion.creditos = inscripcion.paralelos
      .map((pid: string) => oferta.paralelos.find((p: any) => p.id === pid).sigla)
      .map((sigla: string) => oferta.materias.find((m: any) => m.sigla === sigla).creditos)
      .reduce((a: number, b: number) => a + b, 0);
    escribirJson('inscripciones.json', inscripciones);
    return inscripcion;
  }
}
