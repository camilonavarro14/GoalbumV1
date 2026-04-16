import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sticker, StickerDocument } from './schemas/sticker.schema';

@Injectable()
export class StickersService {
  constructor(@InjectModel(Sticker.name) private stickerModel: Model<StickerDocument>) {}

  async create(createData: any): Promise<StickerDocument> {
    const createdSticker = new this.stickerModel(createData);
    return createdSticker.save();
  }

  async createBulk(bulkData: any[]): Promise<any> {
    // ordered: false permite que MongoDB continúe rellenando aunque falle un duplicado
    return this.stickerModel.insertMany(bulkData, { ordered: false })
      .catch(err => {
        // En Mongoose 11000 es duplicado, extraer cuantas pasaron y cuantas fallaron
        if (err.code === 11000) {
           return err.insertedDocs; // Devolvemos solo las que si entraron
        }
        throw err;
      });
  }

  async findAll(): Promise<StickerDocument[]> {
    return this.stickerModel.find().exec();
  }

  async findById(id: string): Promise<StickerDocument | null> {
    return this.stickerModel.findById(id).exec();
  }

  async update(id: string, updateData: any): Promise<StickerDocument | null> {
    return this.stickerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string): Promise<StickerDocument | null> {
    return this.stickerModel.findByIdAndDelete(id).exec();
  }
}
