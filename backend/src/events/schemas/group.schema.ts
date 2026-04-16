import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true })
  eventoId: mongoose.Types.ObjectId | string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }] })
  teams: (mongoose.Types.ObjectId | string)[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);

// Compound index just in case we need uniqueness of group code per event
GroupSchema.index({ eventoId: 1, codigo: 1 }, { unique: true });
