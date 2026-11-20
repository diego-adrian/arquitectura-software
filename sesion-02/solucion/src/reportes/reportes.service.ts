import { Injectable } from '@nestjs/common';
import { GESTION_ACTUAL } from '../inscripciones/inscripciones.service';
import { InscripcionesRepositorio } from '../inscripciones/inscripciones.repositorio';
import { OfertaRepositorio } from '../oferta/oferta.repositorio';
import { PagosRepositorio } from '../pagos/pagos.repositorio';

// Capa de negocio: el reporte de ocupación para la Dirección de Carrera.
@Injectable()
export class ReportesService {
  constructor(
    private readonly ofertaRepo: OfertaRepositorio,
    private readonly inscripcionesRepo: InscripcionesRepositorio,
    private readonly pagosRepo: PagosRepositorio,
  ) {}

  ocupacion() {
    const oferta = this.ofertaRepo.leer();
    const inscripciones = this.inscripcionesRepo.deLaGestion(GESTION_ACTUAL);
    const pagos = this.pagosRepo.deLaGestion(GESTION_ACTUAL);

    const paralelos = oferta.paralelos.map((p: any) => {
      const inscritos = inscripciones.filter((i: any) => i.paralelos.includes(p.id)).length;
      return {
        id: p.id,
        sigla: p.sigla,
        docente: p.docente,
        cupo: p.cupo,
        inscritos,
        ocupacion: Math.round((inscritos / p.cupo) * 100),
      };
    });

    return {
      gestion: GESTION_ACTUAL,
      totalInscritos: inscripciones.length,
      recaudado: pagos.reduce((total: number, p: any) => total + p.monto, 0),
      paralelos,
    };
  }
}
