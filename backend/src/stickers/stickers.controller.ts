import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/schemas/user.schema';

@Controller('stickers')
export class StickersController {
  constructor(private readonly stickersService: StickersService) {}

  @Get()
  async findAll() {
    return this.stickersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stickersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createData: any) {
    return this.stickersService.create(createData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('bulk')
  async createBulk(@Body() createDataArray: any[]) {
    if (!Array.isArray(createDataArray)) {
      return { success: false, message: 'La petición debe ser un arreglo de láminas' };
    }
    const results = await this.stickersService.createBulk(createDataArray);
    return { success: true, count: results ? results.length : 0 };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.stickersService.update(id, updateData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.stickersService.remove(id);
  }
}
