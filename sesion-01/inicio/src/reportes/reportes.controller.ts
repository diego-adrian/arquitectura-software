import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { SESIONES } from '../auth/auth.controller';
import { GESTION_ACTUAL } from '../inscripciones/inscripciones.service';
import { leerJson } from '../utils/utils';

// Reporte para la Dirección de Carrera (el frontend solo muestra el botón al director).
@Controller('api/reportes')
export class ReportesController {
  @Get('ocupacion')
  ocupacion(@Req() req: any) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!SESIONES.get(token)) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const oferta = leerJson('oferta.json');
    const inscripciones = leerJson('inscripciones.json').filter((i: any) => i.gestion === GESTION_ACTUAL);
    const pagos = leerJson('pagos.json').filter((p: any) => p.gestion === GESTION_ACTUAL);

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
