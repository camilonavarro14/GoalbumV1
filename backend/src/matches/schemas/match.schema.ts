import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type MatchDocument = Match & Document;

export enum MatchState {
  PENDIENTE = 'PENDIENTE',
  JUGADO = 'JUGADO'
}

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true })
  eventoId: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group' })
  grupoId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true })
  localTeamId: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true })
  visitanteTeamId: Types.ObjectId | string;

  @Prop({ required: true })
  fechaHora: Date;

  @Prop({ default: 0 })
  golesLocal: number;

  @Prop({ default: 0 })
  golesVisitante: number;

  @Prop({ enum: MatchState, default: MatchState.PENDIENTE })
  estado: MatchState;

  @Prop()
  fase: string;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
