import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type TradeDocument = Trade & Document;

export enum TradeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userA: mongoose.Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userB: mongoose.Types.ObjectId | string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sticker' }] })
  offeredStickersA: (mongoose.Types.ObjectId | string)[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sticker' }] })
  offeredStickersB: (mongoose.Types.ObjectId | string)[];

  @Prop({ enum: TradeStatus, default: TradeStatus.PENDING })
  status: TradeStatus;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
