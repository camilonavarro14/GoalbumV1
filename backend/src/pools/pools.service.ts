import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pool, PoolDocument } from './schemas/pool.schema';
import { Prediction, PredictionDocument } from './schemas/prediction.schema';
import { Match, MatchDocument, MatchState } from '../matches/schemas/match.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class PoolsService {
  constructor(
    @InjectModel(Pool.name) private poolModel: Model<PoolDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<PoolDocument[]> {
    return this.poolModel.find().populate('adminId', 'username email').exec();
  }

  async createPool(adminId: string, poolData: any): Promise<PoolDocument> {
    const defaultCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPool = new this.poolModel({
      ...poolData,
      adminId: adminId,
      codigoAcceso: poolData.codigoAcceso || defaultCodigo,
      participantes: [adminId], // El creador entra por defecto
      pendientes: []
    });
    return newPool.save();
  }

  async joinPool(userId: string, codigoAcceso: string): Promise<PoolDocument> {
    const pool = await this.poolModel.findOne({ codigoAcceso });
    if (!pool) throw new NotFoundException('Polla Fútbolera no encontrada con ese código');

    const strId = userId.toString();
    const esParticipante = pool.participantes.some(id => id.toString() === strId);
    if (esParticipante) throw new BadRequestException('Ya eres un participante activo en esta polla.');

    const estaPendiente = pool.pendientes.some(id => id.toString() === strId);
    if (!estaPendiente) {
      pool.pendientes.push(userId);
      await pool.save();
    }
    return pool;
  }

  async approveParticipant(poolId: string, adminId: string, userId: string): Promise<PoolDocument> {
    const pool = await this.poolModel.findById(poolId);
    if (!pool) throw new NotFoundException('Polla no encontrada');
    if (pool.adminId.toString() !== adminId) throw new BadRequestException('Solo el creador puede aprobar.');

    pool.pendientes = pool.pendientes.filter(id => id.toString() !== userId);
    
    if (!pool.participantes.some(id => id.toString() === userId)) {
      pool.participantes.push(userId);
    }
    return pool.save();
  }

  async getMyPools(userId: string) {
    const poolsParticipando = await this.poolModel.find({ participantes: userId as any }).populate('adminId', 'username').exec();
    const poolsPendientes = await this.poolModel.find({ pendientes: userId as any }).populate('adminId', 'username').exec();
    return { activos: poolsParticipando, pendientes: poolsPendientes };
  }

  async getPoolConfig(poolId: string) {
    return this.poolModel.findById(poolId)
      .populate('adminId', 'username email')
      .populate('participantes', 'username email')
      .populate('pendientes', 'username email')
      .exec();
  }

  async getLeaderboard(poolId: string) {
    const pool = await this.poolModel.findById(poolId).populate('participantes', 'username email imgUrl').exec();
    if (!pool) throw new NotFoundException('Polla no encontrada');

    // Fetch all MATCHES of the pool's Event that are already JUGADO
    const matches = await this.matchModel.find({ eventoId: pool.eventoId as any, estado: MatchState.JUGADO }).exec();
    const matchIds = matches.map(m => m._id);

    // Fetch all predictions for these matches made by participants
    const predictions = await this.predictionModel.find({
      userId: { $in: pool.participantes as any[] },
      matchId: { $in: matchIds as any[] }
    }).exec();

    const stats = pool.participantes.map((user: any) => {
      let puntosTotales = 0;
      let puntajesExactos = 0;

      // Evaluar predicciones vs resultados reales
      for (const m of matches) {
        const pred = predictions.find(p => p.matchId.toString() === m._id.toString() && p.userId.toString() === user._id.toString());
        if (pred) {
          const predLocal = pred.marcadorLocal;
          const predVis = pred.marcadorVisitante;
          const realLocal = m.golesLocal;
          const realVis = m.golesVisitante;

          if (predLocal === realLocal && predVis === realVis) {
            puntosTotales += pool.reglas.exacto || 5;
            puntajesExactos++;
          } else if (Math.sign(predLocal - predVis) === Math.sign(realLocal - realVis)) {
            puntosTotales += pool.reglas.ganador || 3;
          } else if (predLocal === realLocal || predVis === realVis) {
            puntosTotales += pool.reglas.unMarcador || 1;
          }
        }
      }

      return {
        userId: user._id,
        username: user.username,
        puntos: puntosTotales,
        exactos: puntajesExactos
      };
    });

    stats.sort((a, b) => b.puntos - a.puntos || b.exactos - a.exactos);
    return stats;
  }

  async predictMatch(userId: string, matchId: string, scoredHome: number, scoredAway: number): Promise<PredictionDocument> {
    let prediction = await this.predictionModel.findOne({ userId: userId as any, matchId: matchId as any });

    if (prediction) {
      prediction.marcadorLocal = scoredHome;
      prediction.marcadorVisitante = scoredAway;
      return prediction.save();
    }

    const newPrediction = new this.predictionModel({
      userId: userId,
      matchId: matchId,
      marcadorLocal: scoredHome,
      marcadorVisitante: scoredAway
    });

    return newPrediction.save();
  }

  async getMyPredictions(userId: string, matchIds: string[]) {
      return this.predictionModel.find({
        userId: userId as any,
        matchId: { $in: matchIds as any[] }
      }).exec();
  }
}
