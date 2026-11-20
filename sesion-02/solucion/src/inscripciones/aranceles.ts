// Aranceles por tipo de estudiante (montos ficticios).
// Para agregar un tipo nuevo se escribe UNA clase nueva y se suma a ARANCELES_VIGENTES:
// InscripcionesService no se toca (abierto a extensión, cerrado a modificación).
export const ARANCELES = 'ARANCELES';

const MATRICULA = 400;
const PRECIO_CREDITO = 190;
const RECARGO_TRASPASO = 250;

export interface Arancel {
  readonly tipo: string;
  calcular(creditos: number): number;
}

export class ArancelRegular implements Arancel {
  readonly tipo = 'regular';
  calcular(creditos: number): number {
    return MATRICULA + creditos * PRECIO_CREDITO;
  }
}

export class ArancelBecado implements Arancel {
  readonly tipo = 'becado';
  calcular(creditos: number): number {
    return MATRICULA + creditos * PRECIO_CREDITO * 0.5;
  }
}

export class ArancelConvenio implements Arancel {
  readonly tipo = 'convenio';
  calcular(creditos: number): number {
    return MATRICULA + creditos * PRECIO_CREDITO * 0.7;
  }
}

export class ArancelTraspaso implements Arancel {
  readonly tipo = 'traspaso';
  calcular(creditos: number): number {
    return MATRICULA + creditos * PRECIO_CREDITO + RECARGO_TRASPASO;
  }
}

export const ARANCELES_VIGENTES: Arancel[] = [
  new ArancelRegular(),
  new ArancelBecado(),
  new ArancelConvenio(),
  new ArancelTraspaso(),
];
