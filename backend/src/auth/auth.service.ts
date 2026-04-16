import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(correo: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByCorreo(correo);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { correo: user.correo, sub: user._id, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload
    };
  }

  async register(userDto: any) {
    const user = await this.usersService.create(userDto);
    return this.login(user);
  }
}
