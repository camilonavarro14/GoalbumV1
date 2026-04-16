import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradeStatus } from './schemas/trade.schema';

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get('search')
  async searchMatches(@Request() req: any) {
    return this.tradesService.searchMatches(req.user.userId);
  }

  @Get('me')
  async getMyTrades(@Request() req: any) {
    return this.tradesService.getMyTrades(req.user.userId);
  }

  @Post('propose')
  async proposeTrade(@Request() req: any, @Body() body: { targetUserId: string, oferta: string[], peticion: string[] }) {
    return this.tradesService.proposeTrade(req.user.userId, body.targetUserId, body.oferta, body.peticion);
  }

  @Patch(':id/status')
  async updateTradeStatus(@Param('id') tradeId: string, @Request() req: any, @Body() body: { status: string }) {
    // Validar el formato
    const newStatus = TradeStatus[body.status.toUpperCase() as keyof typeof TradeStatus];
    return this.tradesService.updateTradeStatus(tradeId, req.user.userId, newStatus);
  }
}
