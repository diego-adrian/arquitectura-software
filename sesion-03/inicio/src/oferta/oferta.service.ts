import { Injectable } from '@nestjs/common';
import { InscripcionesRepositorio } from '../inscripciones/inscripciones.repositorio';
import { MAX_CREDITOS } from '../inscripciones/reglas-de-inscripcion';
import { OfertaRepositorio } from './oferta.repositorio';

// Capa de negocio: arma la oferta de la gestión con los cupos disponibles.
@Injectable()
export class OfertaService {
  constructor(
    private readonly ofertaRepo: OfertaRepositorio,
    private readonly inscripcionesRepo: InscripcionesRepositorio,
  ) {}

  ofertaDeLaGestion() {
    const oferta = this.ofertaRepo.leer();
    const inscripciones = this.inscripcionesRepo.deLaGestion(oferta.gestion);

    const materias = oferta.materias.map((materia: any) => {
      const grupos = oferta.paralelos
        .filter((p: any) => p.sigla === materia.sigla)
        .map((grupo: any) => {
          // cuántos estudiantes ya están inscritos en este grupo
          const inscritos = inscripciones.filter((i: any) => i.paralelos.includes(grupo.id)).length;
          return { ...grupo, inscritos, disponibles: grupo.cupo - inscritos };
        });
      return { ...materia, paralelos: grupos };
    });

    return {
      gestion: oferta.gestion,
      carrera: oferta.carrera,
      periodoInscripcion: oferta.periodoInscripcion,
      maxCreditos: MAX_CREDITOS,
      materias,
    };
  }
}
