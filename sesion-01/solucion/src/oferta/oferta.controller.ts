import { Controller, Get, UseGuards } from '@nestjs/common';
import { SesionGuard } from '../auth/sesion.guard';
import { MAX_CREDITOS } from '../inscripciones/reglas-de-inscripcion';
import { leerJson } from '../utils/utils';

@Controller('api')
@UseGuards(SesionGuard)
export class OfertaController {
  @Get('oferta')
  oferta() {
    const oferta = leerJson('oferta.json');
    const inscripciones = leerJson('inscripciones.json');

    const materias = oferta.materias.map((materia: any) => {
      const grupos = oferta.paralelos
        .filter((p: any) => p.sigla === materia.sigla)
        .map((grupo: any) => {
          // cuántos estudiantes ya están inscritos en este grupo
          const inscritos = inscripciones.filter(
            (i: any) => i.gestion === oferta.gestion && i.paralelos.includes(grupo.id),
          ).length;
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
