import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { InscripcionesController } from './inscripciones/inscripciones.controller';
import { InscripcionesService } from './inscripciones/inscripciones.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ARANCELES, ARANCELES_VIGENTES } from './inscripciones/aranceles';
import { InscripcionesRepositorio } from './inscripciones/inscripciones.repositorio';
import { KardexLegadoClient } from './inscripciones/kardex-legado.client';
import { LECTOR_KARDEX } from './inscripciones/lector-kardex';
import { ReglaIncumplidaFilter } from './inscripciones/regla-incumplida.filter';
import { KardexController } from './kardex/kardex.controller';
import { KardexService } from './kardex/kardex.service';
import { SistemaAcademicoClient } from './kardex/sistema-academico.client';
import { CorreoInstitucional } from './notificaciones/correo-institucional';
import { NOTIFICADOR } from './notificaciones/notificador';
import { OfertaController } from './oferta/oferta.controller';
import { OfertaRepositorio } from './oferta/oferta.repositorio';
import { OfertaService } from './oferta/oferta.service';
import { PagosRepositorio } from './pagos/pagos.repositorio';
import { PagosService } from './pagos/pagos.service';
import { PASARELA } from './pagos/pasarela';
import { PasarelaQrClient } from './pagos/pasarela-qr.client';
import { ReportesController } from './reportes/reportes.controller';
import { ReportesService } from './reportes/reportes.service';
import { UsuariosRepositorio } from './usuarios/usuarios.repositorio';

@Module({
  // Capa de presentación
  controllers: [AuthController, OfertaController, InscripcionesController, KardexController, ReportesController],
  providers: [
    // Capa de negocio
    AuthService,
    OfertaService,
    InscripcionesService,
    PagosService,
    KardexService,
    ReportesService,
    // Capa de datos
    UsuariosRepositorio,
    OfertaRepositorio,
    InscripcionesRepositorio,
    PagosRepositorio,
    SistemaAcademicoClient,
    // Aquí se decide qué implementación concreta recibe cada abstracción
    { provide: PASARELA, useClass: PasarelaQrClient },
    { provide: NOTIFICADOR, useClass: CorreoInstitucional },
    { provide: LECTOR_KARDEX, useClass: KardexLegadoClient },
    { provide: ARANCELES, useValue: ARANCELES_VIGENTES },
    // Los errores del dominio se traducen a HTTP en un solo lugar
    { provide: APP_FILTER, useClass: ReglaIncumplidaFilter },
  ],
})
export class AppModule {}
