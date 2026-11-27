import { Cobro, PasarelaPago } from './pasarela';

// El detalle: el cliente HTTP de la pasarela de pago QR del banco.
export class PasarelaQrClient implements PasarelaPago {
  private url = process.env.PASARELA_URL || 'http://localhost:4002';

  async cobrar(monto: number, glosa: string): Promise<Cobro> {
    const respuesta = await fetch(`${this.url}/cobros`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ monto, glosa }),
    });
    if (!respuesta.ok) {
      throw new Error(`La pasarela respondió ${respuesta.status}`);
    }
    return respuesta.json();
  }
}
