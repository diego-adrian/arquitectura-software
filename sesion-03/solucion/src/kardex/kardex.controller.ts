import { Controller, Get, UseGuards } from '@nestjs/common';
import { SesionActual } from '../auth/sesion-actual.decorator';
import { SesionGuard } from '../auth/sesion.guard';
import { Sesion } from '../auth/sesiones';
import { KardexService } from './kardex.service';

@Controller('api')
@UseGuards(SesionGuard)
export class KardexController {
  constructor(private readonly servicio: KardexService) {}

  @Get('kardex')
  kardex(@SesionActual() sesion: Sesion) {
    return this.servicio.kardexDe(sesion.id);
  }
}
