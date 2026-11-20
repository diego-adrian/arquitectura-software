import { Inject, Injectable } from '@nestjs/common';
import { GESTION_ACTUAL } from '../inscripciones/inscripciones.service';
import { ahoraIso } from '../utils/utils';
import { PagosRepositorio } from './pagos.repositorio';
import { PASARELA, PasarelaPago } from './pasarela';

@Injectable()
export class PagosService {
  constructor(
    @Inject(PASARELA) private readonly pasarela: PasarelaPago,
    private readonly pagosRepo: PagosRepositorio,
  ) {}

  async cobrar(estudianteId: string, monto: number, glosa: string) {
    const cobro = await this.pasarela.cobrar(monto, glosa);

    this.pagosRepo.agregar({
      id: cobro.id,
      estudianteId,
      gestion: GESTION_ACTUAL,
      monto,
      estado: cobro.estado,
      fecha: ahoraIso(),
    });

    return cobro;
  }
}
