import { Controller, Get, UseGuards } from '@nestjs/common';
import { SesionActual } from '../auth/sesion-actual.decorator';
import { SesionGuard } from '../auth/sesion.guard';
import { Sesion } from '../auth/sesiones';
import { leerJson } from '../utils/utils';

@Controller('api')
@UseGuards(SesionGuard)
export class KardexController {
  @Get('kardex')
  async kardex(@SesionActual() sesion: Sesion) {
    const usuario = leerJson('usuarios.json').find((u: any) => u.id === sesion.id);
    const url = process.env.LEGADO_URL || 'http://localhost:4001';
    const respuesta = await fetch(`${url}/sia/kardex?cod=${usuario.codigo.replace('-', '')}`);
    const csv = await respuesta.text();

    // COD_EST;SIGLA;NOTA;ESTADO;GESTION
    const materias = csv
      .trim()
      .split('\n')
      .slice(1)
      .filter((linea) => linea.length > 0)
      .map((linea) => {
        const col = linea.split(';');
        let estado = col[3];
        if (estado === 'APROB') estado = 'APROBADA';
        if (estado === 'REPROB') estado = 'REPROBADA';
        return {
          sigla: col[1].slice(0, 3) + '-' + col[1].slice(3),
          nota: Number(col[2]),
          estado,
          gestion: col[4],
        };
      });

    return { codigo: usuario.codigo, nombre: usuario.nombre, materias };
  }
}
