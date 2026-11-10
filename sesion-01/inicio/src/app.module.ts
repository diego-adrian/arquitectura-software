import { Module } from '@nestjs/common';
// ojo: dejar InscripcionesController como primer import; si PagosService se importa antes, Nest no arranca
import { InscripcionesController } from './inscripciones/inscripciones.controller';
import { InscripcionesService } from './inscripciones/inscripciones.service';
import { AuthController } from './auth/auth.controller';
import { KardexController } from './kardex/kardex.controller';
import { OfertaController } from './oferta/oferta.controller';
import { PagosService } from './pagos/pagos.service';
import { ReportesController } from './reportes/reportes.controller';

@Module({
  controllers: [AuthController, OfertaController, InscripcionesController, KardexController, ReportesController],
  providers: [InscripcionesService, PagosService],
})
export class AppModule {}
