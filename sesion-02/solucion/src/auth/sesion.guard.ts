import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SESIONES } from './sesiones';

// La ÚNICA verificación de sesión del sistema.
// Antes estaba copiada en 7 handlers; ahora cada controlador dice @UseGuards(SesionGuard).
@Injectable()
export class SesionGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest();
    const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
    const sesion = tipo === 'Bearer' ? SESIONES.get(token) : undefined;
    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }
    peticion.sesion = sesion; // la deja disponible para @SesionActual()
    return true;
  }
}
