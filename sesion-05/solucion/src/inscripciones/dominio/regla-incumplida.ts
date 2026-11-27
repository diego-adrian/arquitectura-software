// Error del dominio: una regla del reglamento no se cumple.
// No sabe nada de HTTP. ReglaIncumplidaFilter lo traduce a 400 (inválida) o 409 (conflicto).
export type TipoDeRegla = 'invalida' | 'conflicto';

export class ReglaIncumplida extends Error {
  constructor(
    mensaje: string,
    readonly tipo: TipoDeRegla = 'invalida',
  ) {
    super(mensaje);
    this.name = 'ReglaIncumplida';
  }
}
