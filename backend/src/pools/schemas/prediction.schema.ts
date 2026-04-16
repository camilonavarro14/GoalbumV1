import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type PredictionDocument = Prediction & Document;

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true })
  matchId: mongoose.Schema.Types.ObjectId | string;

  @Prop({ required: true })
  marcadorLocal: number;

  @Prop({ required: true })
  marcadorVisitante: number;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);

// Indice compuesto para que un usuario solo pueda tener 1 predicción universal por partido
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
