// Levanta los dos sistemas externos que usa Cupo. Déjalo corriendo en su propia terminal:
//   pnpm simuladores
import { crearLegado } from './legado';
import { crearPasarela } from './pasarela';

const puertoLegado = Number(process.env.LEGADO_PUERTO ?? 4001);
const puertoPasarela = Number(process.env.PASARELA_PUERTO ?? 4002);

crearLegado().listen(puertoLegado, () =>
  console.log(`Sistema académico legado  -> http://localhost:${puertoLegado}/sia/kardex?cod=20231001`),
);
crearPasarela().listen(puertoPasarela, () =>
  console.log(`Pasarela de pago QR       -> http://localhost:${puertoPasarela}/cobros`),
);
