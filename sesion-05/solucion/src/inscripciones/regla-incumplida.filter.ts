import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ReglaIncumplida } from './dominio/regla-incumplida';

// Traduce los errores del dominio a respuestas HTTP, con la misma forma que usa Nest.
@Catch(ReglaIncumplida)
export class ReglaIncumplidaFilter implements ExceptionFilter {
  catch(error: ReglaIncumplida, host: ArgumentsHost) {
    const estado = error.tipo === 'conflicto' ? 409 : 400;
    host
      .switchToHttp()
      .getResponse()
      .status(estado)
      .json({ message: error.message, error: estado === 409 ? 'Conflict' : 'Bad Request', statusCode: estado });
  }
}
