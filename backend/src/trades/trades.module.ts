import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { Trade, TradeSchema } from './schemas/trade.schema';
import { UserSticker, UserStickerSchema } from '../collections/schemas/user-sticker.schema';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),
    MongooseModule.forFeature([{ name: UserSticker.name, schema: UserStickerSchema }]),
    CollectionsModule
  ],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
