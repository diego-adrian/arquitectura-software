import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SesionActual } from '../auth/sesion-actual.decorator';
import { SesionGuard } from '../auth/sesion.guard';
import { Sesion } from '../auth/sesiones';
import { InscripcionesService } from './inscripciones.service';

@Controller('api/inscripciones')
@UseGuards(SesionGuard)
export class InscripcionesController {
  constructor(private readonly servicio: InscripcionesService) {}

  @Post()
  inscribir(@SesionActual() sesion: Sesion, @Body() body: any) {
    return this.servicio.inscribir(sesion.id, body);
  }

  @Get('mia')
  mia(@SesionActual() sesion: Sesion) {
    return this.servicio.deLaGestion(sesion.id);
  }

  @Get(':id')
  ver(@Param('id') id: string) {
    return this.servicio.buscar(id);
  }

  @Delete(':id/paralelos/:paraleloId')
  retirar(@SesionActual() sesion: Sesion, @Param('id') id: string, @Param('paraleloId') paraleloId: string) {
    return this.servicio.retirar(sesion.id, id, paraleloId);
  }
}
