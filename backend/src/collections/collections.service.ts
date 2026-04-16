import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSticker, UserStickerDocument, StickerType } from './schemas/user-sticker.schema';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(UserSticker.name) private userStickerModel: Model<UserStickerDocument>
  ) {}

  async getUserCollection(userId: string): Promise<UserStickerDocument[]> {
    return this.userStickerModel.find({ userId }).populate('stickerId').exec();
  }

  async addSticker(userId: string, stickerId: string, cantidadToAdd: number = 1): Promise<UserStickerDocument> {
    let userSticker = await this.userStickerModel.findOne({ userId, stickerId });

    if (userSticker) {
      userSticker.cantidad += cantidadToAdd;
      if (userSticker.cantidad > 1) {
        userSticker.tipo = StickerType.REPETIDA;
        userSticker.disponibleCambio = true;
      }
      return userSticker.save();
    }

    const newRecord = new this.userStickerModel({
      userId,
      stickerId,
      cantidad: cantidadToAdd,
      tipo: cantidadToAdd > 1 ? StickerType.REPETIDA : StickerType.UNICA,
      disponibleCambio: cantidadToAdd > 1,
    });
    return newRecord.save();
  }

  async removeSticker(userId: string, stickerId: string, cantidadToRemove: number = 1): Promise<UserStickerDocument | null> {
    let userSticker = await this.userStickerModel.findOne({ userId, stickerId });

    if (!userSticker) {
      throw new NotFoundException('No posees esta lámina en tu colección');
    }

    userSticker.cantidad -= cantidadToRemove;

    if (userSticker.cantidad <= 0) {
      await this.userStickerModel.deleteOne({ _id: userSticker._id });
      return null;
    }

    if (userSticker.cantidad === 1) {
      userSticker.tipo = StickerType.UNICA;
      userSticker.disponibleCambio = false;
    }

    return userSticker.save();
  }
}
