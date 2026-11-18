// La abstracción de una pasarela de pago: PagosService depende de esto, no del banco.
export const PASARELA = 'PASARELA';

export interface Cobro {
  id: string;
  estado: string;
  monto: number;
}

export interface PasarelaPago {
  cobrar(monto: number, glosa: string): Promise<Cobro>;
}
