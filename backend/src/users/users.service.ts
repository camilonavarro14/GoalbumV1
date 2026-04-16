import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOneByCorreo(correo: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ correo }).exec();
  }

  async create(userDto: any): Promise<UserDocument> {
    const existingUser = await this.findOneByCorreo(userDto.correo);
    if (existingUser) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }

    if (userDto.celular) {
      const existingPhone = await this.userModel.findOne({ celular: userDto.celular }).exec();
      if (existingPhone) {
        throw new BadRequestException('El celular ya se encuentra registrado por otro usuario');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userDto.password, salt);
    
    // Si el correo contiene "admin", lo creamos como ADMIN de prueba
    const rol = userDto.correo.includes('admin') ? Role.ADMIN : Role.USER;

    const createdUser = new this.userModel({
      ...userDto,
      password: hashedPassword,
      rol,
    });
    return createdUser.save();
  }

  async findAll(page: number = 1, search: string = ''): Promise<{ users: UserDocument[], total: number, page: number, totalPages: number }> {
    const limit = 10;
    const skip = (page - 1) * limit;

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { correo: { $regex: search, $options: 'i' } },
          { usuario: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await this.userModel.countDocuments(query);
    const users = await this.userModel.find(query)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .exec();

    return {
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async update(id: string, updateData: any): Promise<UserDocument | null> {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password').exec();
  }

  async remove(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
