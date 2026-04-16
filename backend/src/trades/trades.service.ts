import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade, TradeDocument, TradeStatus } from './schemas/trade.schema';
import { UserSticker, UserStickerDocument } from '../collections/schemas/user-sticker.schema';
import { CollectionsService } from '../collections/collections.service';

@Injectable()
export class TradesService {
  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<TradeDocument>,
    @InjectModel(UserSticker.name) private userStickerModel: Model<UserStickerDocument>,
    private collectionsService: CollectionsService,
  ) {}

  // Algoritmo MVP de Matchmaking
  // Busca usuarios que tienen láminas repetidas que a ti te faltan
  async searchMatches(myUserId: string) {
    // 1. Obtener todas las láminas que YO ya tengo (sean únicas o repetidas)
    const myStickers = await this.userStickerModel.find({ userId: myUserId }).exec();
    const myStickerIds = myStickers.map(s => s.stickerId.toString());

    // 2. Buscar todas las láminas de OTROS usuarios que estén "disponibleCambio: true" 
    // y excluyendo las láminas que yo ya tengo.
    const matches = await this.userStickerModel.find({
      userId: { $ne: new Types.ObjectId(myUserId) },
      disponibleCambio: true,
      stickerId: { $nin: myStickerIds.map(id => new Types.ObjectId(id)) }
    })
    .populate('userId', 'correo usuario')
    .populate('stickerId')
    .exec();

    // Agrupar los resultados por el usuario que ofrece el cambio
    const groupedMatches = matches.reduce((acc: Record<string, any>, match: any) => {
      const otherUserId = match.userId._id.toString();
      if (!acc[otherUserId]) {
        acc[otherUserId] = {
          user: match.userId,
          theyHaveWhatIneneed: []
        };
      }
      acc[otherUserId].theyHaveWhatIneneed.push(match.stickerId);
      return acc;
    }, {});

    return Object.values(groupedMatches);
  }

  async proposeTrade(userAId: string, userBId: string, miOfertaIds: string[], miPeticionIds: string[]): Promise<TradeDocument> {
    if (userAId === userBId) {
      throw new BadRequestException('No puedes proponer un intercambio contigo mismo');
    }
    
    // NOTA: Para un paso productivo, aquí deberías verificar que:
    // 1. UserA realmente tiene miOfertaIds como repetidas.
    // 2. UserB realmente tiene miPeticionIds como repetidas.

    // ESTRICTA CONVERSIÓN A OBJECTID (Fuerza la compatibilidad con .populate() luego)
    const newTrade = new this.tradeModel({
      userA: new Types.ObjectId(userAId),
      userB: new Types.ObjectId(userBId),
      offeredStickersA: miOfertaIds.map(id => new Types.ObjectId(id)),
      offeredStickersB: miPeticionIds.map(id => new Types.ObjectId(id)),
      status: TradeStatus.PENDING,
    });

    return newTrade.save();
  }

  async getMyTrades(userId: string): Promise<TradeDocument[]> {
    return this.tradeModel.find({
      $or: [{ userA: userId }, { userB: userId }]
    })
    .populate('userA', 'correo usuario')
    .populate('userB', 'correo usuario')
    .populate('offeredStickersA')
    .populate('offeredStickersB')
    .exec();
  }

  async updateTradeStatus(tradeId: string, userId: string, newStatus: TradeStatus): Promise<TradeDocument | null> {
    const trade = await this.tradeModel.findById(tradeId);
    if (!trade) throw new BadRequestException('Intercambio no encontrado');

    // Solo el UserB (receptor) puede ACEPTAR o RECHAZAR una oferta inicialmente.
    if (trade.userB.toString() !== userId && [TradeStatus.ACCEPTED, TradeStatus.REJECTED].includes(newStatus)) {
      throw new BadRequestException('Solo el destinatario puede aceptar o rechazar esta oferta');
    }

    // Ejecutar intercambio algorítmicamente
    if (trade.status === TradeStatus.PENDING && newStatus === TradeStatus.ACCEPTED) {
      try {
        // A le da a B sus ofertadas
        for (const st of trade.offeredStickersA) {
          await this.collectionsService.removeSticker(trade.userA.toString(), st.toString(), 1);
          await this.collectionsService.addSticker(trade.userB.toString(), st.toString(), 1);
        }
        // B le da a A sus ofertadas
        for (const st of trade.offeredStickersB) {
          await this.collectionsService.removeSticker(trade.userB.toString(), st.toString(), 1);
          await this.collectionsService.addSticker(trade.userA.toString(), st.toString(), 1);
        }
      } catch (e) {
        throw new BadRequestException('Error transfiriendo láminas. Es posible que uno de los usuarios ya no tenga las repetidas prometidas.');
      }
    }

    trade.status = newStatus;
    
    return trade.save();
  }
}
