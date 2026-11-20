import * as fs from 'node:fs';
import * as path from 'node:path';
import { carpetaDatos } from '../utils/utils';
import { Notificador } from './notificador';

// El detalle: "envía" el correo institucional dejándolo escrito en datos/correos.log
export class CorreoInstitucional implements Notificador {
  async enviar(para: string, asunto: string, cuerpo: string): Promise<void> {
    if (process.env.CORREO_FALLA === 'true') {
      throw new Error('Servidor de correo no disponible');
    }
    const linea = `[${new Date().toISOString()}] Para: ${para} | ${asunto}\n${cuerpo}\n\n`;
    fs.appendFileSync(path.join(carpetaDatos(), 'correos.log'), linea);
  }
}
