import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  usuario: string;

  @Prop({ required: true, unique: true })
  correo: string;

  @Prop({ unique: true, sparse: true, required: true })
  celular: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ enum: Role, default: Role.USER })
  rol: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
