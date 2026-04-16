import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('me')
  async getMyCollection(@Request() req: any) {
    return this.collectionsService.getUserCollection(req.user.userId);
  }

  @Get('public/:userId')
  async getPublicCollection(@Param('userId') partnerId: string) {
    const col = await this.collectionsService.getUserCollection(partnerId);
    return col.filter(s => s.disponibleCambio === true); // Solo las disponibles
  }

  @Get('compare/:userId')
  async compareCollections(@Request() req: any, @Param('userId') partnerId: string) {
    const myCol = await this.collectionsService.getUserCollection(req.user.userId);
    const hisCol = await this.collectionsService.getUserCollection(partnerId);

    // Extraer láminas con objetos poblados
    const myRepeated = myCol.filter(s => s.cantidad > 1).map(s => s.stickerId);
    const hisRepeated = hisCol.filter(s => s.cantidad > 1).map(s => s.stickerId);

    // Listas de IDs de las colecciones completas para saber qué ya tienen
    const himHasIds = hisCol.map((s: any) => s.stickerId._id.toString());
    const meHasIds = myCol.map((s: any) => s.stickerId._id.toString());

    // Mis repetidas que a él le sirven (filtrar las que él ya tiene)
    const theyNeed = myRepeated.filter((s: any) => !himHasIds.includes(s._id.toString()));

    // Sus repetidas que a mi me sirven (filtrar las que yo ya tengo)
    const iNeed = hisRepeated.filter((s: any) => !meHasIds.includes(s._id.toString()));

    return { theyNeed, iNeed };
  }

  @Post('add')
  async addSticker(@Request() req: any, @Body() body: { stickerId: string, cantidad?: number }) {
    return this.collectionsService.addSticker(req.user.userId, body.stickerId, body.cantidad || 1);
  }

  @Delete('remove')
  async removeSticker(@Request() req: any, @Body() body: { stickerId: string, cantidad?: number }) {
    return this.collectionsService.removeSticker(req.user.userId, body.stickerId, body.cantidad || 1);
  }
}
