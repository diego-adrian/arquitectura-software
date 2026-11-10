import { Body, Controller, Delete, Get, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { SESIONES } from '../auth/auth.controller';
import { InscripcionesService } from './inscripciones.service';

@Controller('api/inscripciones')
export class InscripcionesController {
  constructor(private readonly servicio: InscripcionesService) {}

  @Post()
  inscribir(@Req() req: any, @Body() body: any) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    const sesion = SESIONES.get(token);
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return this.servicio.inscribir(sesion.id, body);
  }

  @Get('mia')
  mia(@Req() req: any) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    const sesion = SESIONES.get(token);
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return this.servicio.deLaGestion(sesion.id);
  }

  @Get(':id')
  ver(@Req() req: any, @Param('id') id: string) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !SESIONES.has(token)) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return this.servicio.buscar(id);
  }

  @Delete(':id/paralelos/:paraleloId')
  retirar(@Req() req: any, @Param('id') id: string, @Param('paraleloId') paraleloId: string) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    const sesion = SESIONES.get(token);
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return this.servicio.retirar(sesion.id, id, paraleloId);
  }
}
