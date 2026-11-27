import { Inject, Injectable } from '@nestjs/common';
import { PagosRepositorio } from './pagos.repositorio';
import { PASARELA, PasarelaPago } from './pasarela';

@Injectable()
export class PagosService {
  constructor(
    @Inject(PASARELA) private readonly pasarela: PasarelaPago,
    private readonly pagosRepo: PagosRepositorio,
  ) {}

  async cobrar(estudianteId: string, monto: number, glosa: string, gestion: string) {
    const cobro = await this.pasarela.cobrar(monto, glosa);

    this.pagosRepo.agregar({
      id: cobro.id,
      estudianteId,
      gestion,
      monto,
      estado: cobro.estado,
      fecha: new Date().toISOString(),
    });

    return cobro;
  }
}
