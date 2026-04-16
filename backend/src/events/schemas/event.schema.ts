import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

export enum EventCruceType {
  PREDEFINIDO = 'PREDEFINIDO',
  DINAMICO = 'DINAMICO',
  MANUAL = 'MANUAL',
}

export enum EventFormat {
  GRUPOS_ELIMINACION = 'GRUPOS + ELIMINACION',
  LIGA = 'LIGA',
  ELIMINACION_DIRECTA = 'ELIMINACION DIRECTA',
}

export enum EventStatus {
  CONFIGURACION = 'CONFIGURACION',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, unique: true })
  codigo: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ enum: EventCruceType, default: EventCruceType.PREDEFINIDO })
  tipoCruce: EventCruceType;

  @Prop({ enum: EventFormat, default: EventFormat.GRUPOS_ELIMINACION })
  formato: EventFormat;

  @Prop({ enum: EventStatus, default: EventStatus.CONFIGURACION })
  estado: EventStatus;
}

export const EventSchema = SchemaFactory.createForClass(Event);
