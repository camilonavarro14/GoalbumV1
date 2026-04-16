import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument, MatchState } from './schemas/match.schema';

@Injectable()
export class MatchesService {
  constructor(@InjectModel(Match.name) private matchModel: Model<MatchDocument>) {}

  async findAll(): Promise<MatchDocument[]> {
    return this.matchModel.find().exec();
  }

  async findById(id: string): Promise<MatchDocument | null> {
    return this.matchModel.findById(id).exec();
  }

  async create(matchData: any): Promise<MatchDocument> {
    const newMatch = new this.matchModel(matchData);
    return newMatch.save();
  }

  async updateResult(id: string, scoredHome: number, scoredAway: number): Promise<MatchDocument> {
    const match = await this.matchModel.findById(id);
    if (!match) throw new NotFoundException('Partido no encontrado');

    match.golesLocal = scoredHome;
    match.golesVisitante = scoredAway;
    match.estado = MatchState.JUGADO;
    return match.save();
  }
}
