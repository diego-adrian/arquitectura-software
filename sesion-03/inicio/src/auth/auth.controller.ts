import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api')
export class AuthController {
  constructor(private readonly servicio: AuthService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.servicio.login(body?.codigo, body?.password);
  }
}
