import { Injectable } from '@nestjs/common';
import { Paralelo } from '../inscripciones/dominio/paralelo';
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
    const inscritos = this.inscripcionesRepo.inscritosPorParalelo(oferta.gestion);
    const pagos = this.pagosRepo.deLaGestion(oferta.gestion);

    const paralelos = oferta.paralelos.map((datos: any) => {
      const { cupo, porcentaje } = Paralelo.desde(datos).ocupacion(inscritos.get(datos.id) ?? 0);
      return {
        id: datos.id,
        sigla: datos.sigla,
        docente: datos.docente,
        cupo,
        inscritos: inscritos.get(datos.id) ?? 0,
        ocupacion: porcentaje,
      };
    });

    return {
      gestion: oferta.gestion,
      totalInscritos: this.inscripcionesRepo.deLaGestion(oferta.gestion).length,
      recaudado: pagos.reduce((total: number, p: any) => total + p.monto, 0),
      paralelos,
    };
  }
}
