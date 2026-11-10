import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { SESIONES } from '../auth/auth.controller';
import { leerJson } from '../utils/utils';

@Controller('api')
export class OfertaController {
  @Get('oferta')
  oferta(@Req() req: any) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    const sesion = SESIONES.get(token);
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }

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
      maxCreditos: 22,
      materias,
    };
  }
}
