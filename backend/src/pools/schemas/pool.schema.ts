import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type PoolDocument = Pool & Document;

@Schema({ timestamps: true })
export class Pool {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true })
  eventoId: mongoose.Schema.Types.ObjectId | string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  adminId: mongoose.Schema.Types.ObjectId | string;

  @Prop({ type: Object, default: { exacto: 5, ganador: 3, unMarcador: 1 } })
  reglas: {
    exacto: number;
    ganador: number;
    unMarcador: number;
  };

  @Prop({ required: true, unique: true })
  codigoAcceso: string;

  @Prop()
  qrUrl?: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  participantes: (mongoose.Schema.Types.ObjectId | string)[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  pendientes: (mongoose.Schema.Types.ObjectId | string)[];
}

export const PoolSchema = SchemaFactory.createForClass(Pool);
