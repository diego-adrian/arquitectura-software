import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { SESIONES } from './sesiones';

// Capa de negocio: iniciar sesión.
@Injectable()
export class AuthService {
  constructor(private readonly usuarios: UsuariosRepositorio) {}

  login(codigo: string, password: string) {
    const usuario = this.usuarios.buscarPorCredenciales(codigo, password);
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
