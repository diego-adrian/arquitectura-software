import { Controller, Get, UseGuards } from '@nestjs/common';
import { SesionGuard } from '../auth/sesion.guard';
import { OfertaService } from './oferta.service';

// Capa de presentación: recibe la petición, delega y responde.
@Controller('api')
@UseGuards(SesionGuard)
export class OfertaController {
  constructor(private readonly servicio: OfertaService) {}

  @Get('oferta')
  oferta() {
    return this.servicio.ofertaDeLaGestion();
  }
}
