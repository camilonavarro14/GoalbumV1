import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  nombre: string;

  @Prop()
  escudoUrl: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
