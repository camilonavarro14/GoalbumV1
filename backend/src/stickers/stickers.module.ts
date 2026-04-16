import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StickersService } from './stickers.service';
import { StickersController } from './stickers.controller';
import { Sticker, StickerSchema } from './schemas/sticker.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sticker.name, schema: StickerSchema }])],
  controllers: [StickersController],
  providers: [StickersService],
  exports: [StickersService],
})
export class StickersModule {}
