import { Injectable } from '@nestjs/common';
import { Paralelo } from '../inscripciones/dominio/paralelo';
import { MAX_CREDITOS } from '../inscripciones/dominio/reglas';
import { InscripcionesRepositorio } from '../inscripciones/inscripciones.repositorio';
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
    const inscritos = this.inscripcionesRepo.inscritosPorParalelo(oferta.gestion);

    const materias = oferta.materias.map((materia: any) => {
      const paralelos = oferta.paralelos
        .filter((datos: any) => datos.sigla === materia.sigla)
        .map((datos: any) => {
          const ocupados = inscritos.get(datos.id) ?? 0;
          return { ...datos, inscritos: ocupados, disponibles: Paralelo.desde(datos).disponibles(ocupados) };
        });
      return { ...materia, paralelos };
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
