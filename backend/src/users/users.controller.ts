import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(@Query('page') page?: string, @Query('search') search?: string) {
    const pageNumber = page ? parseInt(page) : 1;
    return this.usersService.findAll(pageNumber, search || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('find/:correoStr')
  async findPublicUserByCorreo(@Param('correoStr') correoStr: string) {
    // Busca por el prefijo del correo para que coincida con el QR
    const allUsers = await this.usersService.findAll(1, correoStr); // search param
    if (allUsers.users.length === 0) {
      throw new UnauthorizedException('Compañero de intercambio no encontrado');
    }
    return {
      _id: allUsers.users[0]._id,
      correo: allUsers.users[0].correo,
      usuario: allUsers.users[0].usuario
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any, @Request() req: any) {
    // Si no es admin y quiere actualizar un id que no es el suyo, denegar.
    if (req.user.rol !== Role.ADMIN && req.user.userId !== id) {
      throw new UnauthorizedException('No puedes modificar a otro usuario');
    }
    return this.usersService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // BACKDOOR TEMPORAL (Solo para promover a Camilo)
  @Get('promote/:correo')
  async promoteToAdmin(@Param('correo') correo: string) {
    const user = await this.usersService.findOneByCorreo(correo);
    if (!user) return { success: false, msg: 'Usuario no existe' };
    return this.usersService.update(user._id.toString(), { rol: Role.ADMIN });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
