import * as fs from 'node:fs';
import * as path from 'node:path';
import { carpetaDatos } from '../utils/utils';

// Interfaz de notificaciones (la trajimos del proyecto de la biblioteca).
export interface Notificador {
  enviarCorreo(para: string, asunto: string, cuerpo: string): Promise<void>;
  enviarSms(numero: string, texto: string): Promise<void>;
  enviarPush(usuarioId: string, texto: string): Promise<void>;
  enviarMasivo(destinatarios: string[], asunto: string, cuerpo: string): Promise<void>;
  programar(fecha: Date, para: string, asunto: string, cuerpo: string): Promise<string>;
  cancelarProgramado(id: string): Promise<void>;
}

// "Envía" el correo institucional: lo deja escrito en datos/correos.log
export class CorreoInstitucional implements Notificador {
  async enviarCorreo(para: string, asunto: string, cuerpo: string): Promise<void> {
    if (process.env.CORREO_FALLA === 'true') {
      throw new Error('Servidor de correo no disponible');
    }
    const linea = `[${new Date().toISOString()}] Para: ${para} | ${asunto}\n${cuerpo}\n\n`;
    fs.appendFileSync(path.join(carpetaDatos(), 'correos.log'), linea);
  }

  async enviarSms(numero: string, texto: string): Promise<void> {
    throw new Error('No implementado');
  }

  async enviarPush(usuarioId: string, texto: string): Promise<void> {
    throw new Error('No implementado');
  }

  async enviarMasivo(destinatarios: string[], asunto: string, cuerpo: string): Promise<void> {
    throw new Error('No implementado');
  }

  async programar(fecha: Date, para: string, asunto: string, cuerpo: string): Promise<string> {
    throw new Error('No implementado');
  }

  async cancelarProgramado(id: string): Promise<void> {
    throw new Error('No implementado');
  }
}
