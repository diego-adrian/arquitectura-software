import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Sesion } from './sesiones';

// En un handler: miMetodo(@SesionActual() sesion: Sesion)
// Entrega la sesión que SesionGuard ya verificó.
export const SesionActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): Sesion => contexto.switchToHttp().getRequest().sesion,
);
