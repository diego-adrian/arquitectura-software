import { Injectable } from '@nestjs/common';
import { escribirJson, leerJson } from '../utils/utils';

// Capa de datos: los pagos registrados.
@Injectable()
export class PagosRepositorio {
  agregar(pago: any): void {
    const pagos = leerJson('pagos.json');
    pagos.push(pago);
    escribirJson('pagos.json', pagos);
  }

  deLaGestion(gestion: string): any[] {
    return leerJson('pagos.json').filter((p: any) => p.gestion === gestion);
  }
}
