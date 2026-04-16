import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  codigo: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true })
  eventoId: mongoose.Types.ObjectId | string;
  
  // Archivos multimedia como bandera (opcional)
  @Prop()
  escudoUrl?: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
