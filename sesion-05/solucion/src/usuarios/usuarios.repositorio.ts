import { Injectable } from '@nestjs/common';
import { leerJson } from '../persistencia/archivos-json';

// Capa de datos: el único lugar que sabe dónde están guardados los usuarios.
@Injectable()
export class UsuariosRepositorio {
  buscarPorId(id: string): any {
    return leerJson('usuarios.json').find((u: any) => u.id === id);
  }

  buscarPorCredenciales(codigo: string, password: string): any {
    return leerJson('usuarios.json').find((u: any) => u.codigo === codigo && u.password === password);
  }
}
