import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NOTIFICADOR, Notificador } from '../notificaciones/notificador';
import { OfertaRepositorio } from '../oferta/oferta.repositorio';
import { PagosService } from '../pagos/pagos.service';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { Arancel, ARANCELES } from './aranceles';
import { correoDeConfirmacion } from './correo-de-confirmacion';
import { InscripcionesRepositorio } from './inscripciones.repositorio';
import { LECTOR_KARDEX, LectorKardex } from './lector-kardex';
import { Eleccion, InscripcionDeGestion } from './dominio/inscripcion-de-gestion';
import { Paralelo } from './dominio/paralelo';
import { validarSolicitud } from './dominio/reglas';

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

  // Orquesta la inscripción. Las reglas del reglamento las aplica el agregado InscripcionDeGestion.
  async inscribir(estudianteId: string, body: any) {
    this.rechazarSi(validarSolicitud(body));
    const estudiante = this.buscarEstudiante(estudianteId);
    const oferta = this.ofertaRepo.leer();
    const gestion = oferta.gestion;
    this.verificarPeriodo(oferta);
    this.verificarQueNoEsteInscrito(estudianteId, gestion);

    const elecciones = this.elecciones(oferta, body.paralelos);
    const inscritosPorParalelo = this.inscripciones.inscritosPorParalelo(gestion);
    const siglasAprobadas = await this.kardex.siglasAprobadas(estudiante.codigo);
    const inscripcion = InscripcionDeGestion.crear({
      id: `INS-${randomUUID().slice(0, 8)}`,
      estudianteId,
      codigo: estudiante.codigo,
      gestion,
      elecciones,
      inscritosPorParalelo,
      siglasAprobadas,
      fecha: new Date().toISOString(),
    });

    // La app móvil antigua ya manda el monto calculado
    const monto = body.monto ?? this.montoPara(estudiante.tipo, inscripcion.creditos);
    const cobro = await this.pagos.cobrar(estudianteId, monto, `Matrícula ${gestion} - ${estudiante.codigo}`, gestion);
    inscripcion.registrarPago(cobro.id, monto);
    this.inscripciones.agregar(inscripcion.aDatos()); // vuelve a leer el archivo: por si alguien se inscribió mientras cobrábamos

    const correo = correoDeConfirmacion({
      estudiante,
      paralelos: elecciones.map((e) => e.paralelo),
      materias: elecciones.map((e) => e.materia),
      creditos: inscripcion.creditos,
      monto,
      gestion,
    });
    await this.notificador.enviar(estudiante.correo, correo.asunto, correo.cuerpo);
    return inscripcion.aDatos();
  }

  buscar(id: string) {
    const inscripcion = this.inscripciones.buscar(id);
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    return inscripcion;
  }

  deLaGestion(estudianteId: string) {
    const inscripcion = this.inscripciones.deEstudiante(estudianteId, this.ofertaRepo.gestionActual());
    if (!inscripcion) {
      throw new NotFoundException('Todavía no te inscribiste en esta gestión');
    }
    return inscripcion;
  }

  retirar(estudianteId: string, id: string, paraleloId: string) {
    const datos = this.inscripciones.buscar(id);
    if (!datos) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    const inscripcion = InscripcionDeGestion.desde(datos);
    if (!inscripcion.esDe(estudianteId)) {
      throw new ForbiddenException('Esta inscripción no es tuya');
    }

    const oferta = this.ofertaRepo.leer();
    const sigla = oferta.paralelos.find((p: any) => p.id === paraleloId)?.sigla;
    const creditos = oferta.materias.find((m: any) => m.sigla === sigla)?.creditos ?? 0;
    inscripcion.retirar(paraleloId, creditos);
    this.inscripciones.actualizar(inscripcion.aDatos());
    return inscripcion.aDatos();
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

  private verificarQueNoEsteInscrito(estudianteId: string, gestion: string): void {
    if (this.inscripciones.deEstudiante(estudianteId, gestion)) {
      throw new ConflictException('Ya tienes una inscripción en esta gestión');
    }
  }

  private elecciones(oferta: any, ids: string[]): Eleccion[] {
    return ids.map((id) => {
      const datos = oferta.paralelos.find((p: any) => p.id === id);
      if (!datos) {
        throw new BadRequestException(`El paralelo ${id} no existe`);
      }
      return { paralelo: Paralelo.desde(datos), materia: oferta.materias.find((m: any) => m.sigla === datos.sigla) };
    });
  }

  private montoPara(tipo: string, creditos: number): number {
    const arancel = this.aranceles.find((a) => a.tipo === tipo);
    if (!arancel) {
      throw new Error(`No hay arancel para el tipo de estudiante "${tipo}"`);
    }
    return Math.round(arancel.calcular(creditos) * 100) / 100;
  }
}
