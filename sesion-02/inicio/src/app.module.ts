import { Module } from '@nestjs/common';
// ojo: dejar InscripcionesController como primer import; si PagosService se importa antes, Nest no arranca
import { InscripcionesController } from './inscripciones/inscripciones.controller';
import { InscripcionesService } from './inscripciones/inscripciones.service';
import { AuthController } from './auth/auth.controller';
import { ARANCELES, ARANCELES_VIGENTES } from './inscripciones/aranceles';
import { KardexLegadoClient } from './inscripciones/kardex-legado.client';
import { LECTOR_KARDEX } from './inscripciones/lector-kardex';
import { KardexController } from './kardex/kardex.controller';
import { CorreoInstitucional } from './notificaciones/correo-institucional';
import { NOTIFICADOR } from './notificaciones/notificador';
import { OfertaController } from './oferta/oferta.controller';
import { PagosService } from './pagos/pagos.service';
import { PASARELA } from './pagos/pasarela';
import { PasarelaQrClient } from './pagos/pasarela-qr.client';
import { ReportesController } from './reportes/reportes.controller';

@Module({
  controllers: [AuthController, OfertaController, InscripcionesController, KardexController, ReportesController],
  providers: [
    InscripcionesService,
    PagosService,
    // Aquí se decide qué implementación concreta recibe cada abstracción
    { provide: PASARELA, useClass: PasarelaQrClient },
    { provide: NOTIFICADOR, useClass: CorreoInstitucional },
    { provide: LECTOR_KARDEX, useClass: KardexLegadoClient },
    { provide: ARANCELES, useValue: ARANCELES_VIGENTES },
  ],
})
export class AppModule {}
