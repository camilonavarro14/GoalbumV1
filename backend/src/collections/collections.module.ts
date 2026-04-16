import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { UserSticker, UserStickerSchema } from './schemas/user-sticker.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserSticker.name, schema: UserStickerSchema }])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService]
})
export class CollectionsModule {}
