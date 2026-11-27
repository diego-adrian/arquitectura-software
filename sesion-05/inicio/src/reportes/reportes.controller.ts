import { Controller, Get, UseGuards } from '@nestjs/common';
import { SesionGuard } from '../auth/sesion.guard';
import { ReportesService } from './reportes.service';

// Reporte para la Dirección de Carrera (el frontend solo muestra el botón al director).
@Controller('api/reportes')
@UseGuards(SesionGuard)
export class ReportesController {
  constructor(private readonly servicio: ReportesService) {}

  @Get('ocupacion')
  ocupacion() {
    return this.servicio.ocupacion();
  }
}
