import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  async findAll() {
    return this.poolsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPool(@Request() req: any, @Body() body: any) {
    return this.poolsService.createPool(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async joinPool(@Request() req: any, @Body('codigo') codigo: string) {
    return this.poolsService.joinPool(req.user.userId, codigo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('predict')
  async predictMatch(@Request() req: any, @Body() body: { matchId: string, scoredHome: number, scoredAway: number }) {
    return this.poolsService.predictMatch(req.user.userId, body.matchId, body.scoredHome, body.scoredAway);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPools(@Request() req: any) {
    return this.poolsService.getMyPools(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/approve')
  async approveParticipant(@Request() req: any, @Param('id') poolId: string, @Body('userId') userId: string) {
    return this.poolsService.approveParticipant(poolId, req.user.userId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPoolConfig(@Param('id') poolId: string) {
    return this.poolsService.getPoolConfig(poolId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') poolId: string) {
    return this.poolsService.getLeaderboard(poolId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('predictions/me')
  async getMyPredictions(@Request() req: any, @Body('matchIds') matchIds: string[]) {
    return this.poolsService.getMyPredictions(req.user.userId, matchIds || []);
  }
}
