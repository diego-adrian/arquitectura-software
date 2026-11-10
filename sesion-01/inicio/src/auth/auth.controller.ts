import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { leerJson } from '../utils/utils';

// token -> usuario que inició sesión
export const SESIONES = new Map<string, { id: string; rol: string }>();

@Controller('api')
export class AuthController {
  @Post('login')
  login(@Body() body: any) {
    const usuarios = leerJson('usuarios.json');
    const usuario = usuarios.find((u: any) => u.codigo === body.codigo && u.password === body.password);
    if (!usuario) {
      throw new UnauthorizedException('Código o contraseña incorrectos');
    }

    const token = randomUUID();
    SESIONES.set(token, { id: usuario.id, rol: usuario.rol });

    return {
      token,
      usuario: { id: usuario.id, codigo: usuario.codigo, nombre: usuario.nombre, rol: usuario.rol, tipo: usuario.tipo },
    };
  }
}
