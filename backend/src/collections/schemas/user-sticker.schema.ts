import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserStickerDocument = UserSticker & Document;

export enum StickerType {
  UNICA = 'UNICA',
  REPETIDA = 'REPETIDA',
}

@Schema({ timestamps: true })
export class UserSticker {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | string;

  @Prop({ type: Types.ObjectId, ref: 'Sticker', required: true })
  stickerId: Types.ObjectId | string;

  @Prop({ enum: StickerType, default: StickerType.UNICA })
  tipo: StickerType;

  @Prop({ default: false })
  disponibleCambio: boolean;

  @Prop({ default: 1 })
  cantidad: number;
}

export const UserStickerSchema = SchemaFactory.createForClass(UserSticker);
// Compound index to quickly find user stickers
UserStickerSchema.index({ userId: 1, stickerId: 1 }, { unique: true });
