import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StickerDocument = Sticker & Document;

export enum Rareza {
  COMUN = 'COMUN',
  DORADA = 'DORADA',
  EXTRA = 'EXTRA',
}

@Schema({ timestamps: true })
export class Sticker {
  @Prop({ required: true, unique: true })
  numero: string;

  @Prop()
  nombre: string;

  @Prop()
  equipo: string;

  @Prop({ enum: Rareza, default: Rareza.COMUN })
  rareza: Rareza;
}

export const StickerSchema = SchemaFactory.createForClass(Sticker);
