import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NOTIFICADOR, Notificador } from '../notificaciones/notificador';
import { OfertaRepositorio } from '../oferta/oferta.repositorio';
import { PagosService } from '../pagos/pagos.service';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { ahoraIso, nuevoId } from '../utils/utils';
import { Arancel, ARANCELES } from './aranceles';
import { correoDeConfirmacion } from './correo-de-confirmacion';
import { InscripcionesRepositorio } from './inscripciones.repositorio';
import { LECTOR_KARDEX, LectorKardex } from './lector-kardex';
import {
  buscarChoqueDeHorario,
  sumarCreditos,
  validarSolicitud,
  verificarCreditos,
  verificarPrerrequisitos,
} from './reglas-de-inscripcion';

export const GESTION_ACTUAL = '2027-1';

@Injectable()
export class InscripcionesService {
  constructor(
    private readonly inscripciones: InscripcionesRepositorio,
    private readonly usuarios: UsuariosRepositorio,
    private readonly ofertaRepo: OfertaRepositorio,
    private readonly pagos: PagosService,
    @Inject(NOTIFICADOR) private readonly notificador: Notificador,
    @Inject(LECTOR_KARDEX) private readonly kardex: LectorKardex,
    @Inject(ARANCELES) private readonly aranceles: Arancel[],
  ) {}

  // Orquesta la inscripción: cada paso lo resuelve otra pieza.
  async inscribir(estudianteId: string, body: any) {
    this.rechazarSi(validarSolicitud(body));
    const estudiante = this.buscarEstudiante(estudianteId);
    const oferta = this.ofertaRepo.leer();
    this.verificarPeriodo(oferta);
    this.verificarQueNoEsteInscrito(estudianteId);

    const { paralelos, materias } = this.elegidos(oferta, body.paralelos);
    const creditos = sumarCreditos(materias);
    this.rechazarSi(verificarCreditos(creditos));
    this.verificarCupos(paralelos);
    this.rechazarSi(buscarChoqueDeHorario(paralelos));
    const aprobadas = await this.kardex.siglasAprobadas(estudiante.codigo);
    this.rechazarSi(verificarPrerrequisitos(materias, aprobadas));

    // La app móvil antigua ya manda el monto calculado
    const monto = body.monto ?? this.montoPara(estudiante.tipo, creditos);
    const cobro = await this.pagos.cobrar(estudianteId, monto, `Matrícula ${GESTION_ACTUAL} - ${estudiante.codigo}`);
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
    this.inscripciones.agregar(inscripcion); // vuelve a leer el archivo: por si alguien se inscribió mientras cobrábamos

    const correo = correoDeConfirmacion({ estudiante, paralelos, materias, creditos, monto, gestion: GESTION_ACTUAL });
    await this.notificador.enviar(estudiante.correo, correo.asunto, correo.cuerpo);
    return inscripcion;
  }

  buscar(id: string) {
    const inscripcion = this.inscripciones.buscar(id);
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    return inscripcion;
  }

  deLaGestion(estudianteId: string) {
    const inscripcion = this.inscripciones.deEstudiante(estudianteId, GESTION_ACTUAL);
    if (!inscripcion) {
      throw new NotFoundException('Todavía no te inscribiste en esta gestión');
    }
    return inscripcion;
  }

  retirar(estudianteId: string, id: string, paraleloId: string) {
    const inscripcion = this.inscripciones.buscar(id);
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

    inscripcion.paralelos = inscripcion.paralelos.filter((p: string) => p !== paraleloId);
    inscripcion.creditos = sumarCreditos(this.elegidos(this.ofertaRepo.leer(), inscripcion.paralelos).materias);
    this.inscripciones.actualizar(inscripcion);
    return inscripcion;
  }

  // --- Pasos de la inscripción ---

  private rechazarSi(error: string | null): void {
    if (error) {
      throw new BadRequestException(error);
    }
  }

  private buscarEstudiante(estudianteId: string) {
    const estudiante = this.usuarios.buscarPorId(estudianteId);
    if (!estudiante || estudiante.rol !== 'estudiante') {
      throw new ForbiddenException('Solo los estudiantes pueden inscribirse');
    }
    return estudiante;
  }

  private verificarPeriodo(oferta: any): void {
    const hoy = new Date();
    if (hoy < new Date(oferta.periodoInscripcion.inicio) || hoy > new Date(oferta.periodoInscripcion.fin)) {
      throw new BadRequestException('Fuera del periodo de inscripción');
    }
  }

  private verificarQueNoEsteInscrito(estudianteId: string): void {
    if (this.inscripciones.deEstudiante(estudianteId, GESTION_ACTUAL)) {
      throw new ConflictException('Ya tienes una inscripción en esta gestión');
    }
  }

  private elegidos(oferta: any, ids: string[]) {
    const paralelos: any[] = [];
    const materias: any[] = [];
    for (const id of ids) {
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
    return { paralelos, materias };
  }

  private verificarCupos(paralelos: any[]): void {
    const inscripciones = this.inscripciones.deLaGestion(GESTION_ACTUAL);
    for (const paralelo of paralelos) {
      const inscritos = inscripciones.filter((i: any) => i.paralelos.includes(paralelo.id)).length;
      if (inscritos >= paralelo.cupo) {
        throw new ConflictException(`Ya no hay cupo en ${paralelo.id}`);
      }
    }
  }

  private montoPara(tipo: string, creditos: number): number {
    const arancel = this.aranceles.find((a) => a.tipo === tipo);
    if (!arancel) {
      throw new Error(`No hay arancel para el tipo de estudiante "${tipo}"`);
    }
    return Math.round(arancel.calcular(creditos) * 100) / 100;
  }
}
