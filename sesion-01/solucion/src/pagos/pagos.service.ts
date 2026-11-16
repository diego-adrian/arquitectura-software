import { Inject, Injectable } from '@nestjs/common';
import { GESTION_ACTUAL } from '../inscripciones/inscripciones.service';
import { ahoraIso, escribirJson, leerJson } from '../utils/utils';
import { PASARELA, PasarelaPago } from './pasarela';

@Injectable()
export class PagosService {
  constructor(@Inject(PASARELA) private readonly pasarela: PasarelaPago) {}

  async cobrar(estudianteId: string, monto: number, glosa: string) {
    const cobro = await this.pasarela.cobrar(monto, glosa);

    const pagos = leerJson('pagos.json');
    pagos.push({
      id: cobro.id,
      estudianteId,
      gestion: GESTION_ACTUAL,
      monto,
      estado: cobro.estado,
      fecha: ahoraIso(),
    });
    escribirJson('pagos.json', pagos);

    return cobro;
  }

  pagosDe(estudianteId: string) {
    return leerJson('pagos.json').filter((p: any) => p.estudianteId === estudianteId && p.gestion === GESTION_ACTUAL);
  }
}
