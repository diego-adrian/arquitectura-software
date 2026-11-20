// La abstracción: lo ÚNICO que el sistema necesita de un notificador.
// (Antes era una interfaz de 6 métodos traída de otro proyecto y 5 no se usaban.)
export const NOTIFICADOR = 'NOTIFICADOR';

export interface Notificador {
  enviar(para: string, asunto: string, cuerpo: string): Promise<void>;
}
