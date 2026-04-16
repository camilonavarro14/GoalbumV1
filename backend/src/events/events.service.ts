import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { Team, TeamDocument } from './schemas/team.schema';
import { Group, GroupDocument } from './schemas/group.schema';
import { Match, MatchDocument, MatchState } from '../matches/schemas/match.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async getEvents(): Promise<EventDocument[]> {
    return this.eventModel.find().exec();
  }

  async createEvent(data: any): Promise<EventDocument> {
    const newEvent = new this.eventModel(data);
    return newEvent.save();
  }

  // --- Teams ---
  async getTeams(eventoId: string): Promise<TeamDocument[]> {
    return this.teamModel.find({ eventoId }).exec();
  }

  async createTeamsBulk(eventoId: string, teams: any[]): Promise<any> {
    const bulkData = teams.map(t => ({
      ...t,
      eventoId: new Types.ObjectId(eventoId)
    }));
    return this.teamModel.insertMany(bulkData);
  }

  // --- Groups ---
  async getGroups(eventoId: string): Promise<GroupDocument[]> {
    return this.groupModel.find({ eventoId }).populate('teams').exec();
  }

  async createGroup(eventoId: string, data: any): Promise<GroupDocument> {
    const newGroup = new this.groupModel({ ...data, eventoId: new Types.ObjectId(eventoId) });
    return newGroup.save();
  }

  async createGroupsBulk(eventoId: string, groups: any[]): Promise<any> {
    const allTeams = await this.teamModel.find({ eventoId }).exec();
    const bulks = [];

    for (const g of groups) {
      let teamIds: Types.ObjectId[] = [];
      if (g.equipos) {
        const teamCodes = g.equipos.split('-').map((c: string) => c.trim().toUpperCase());
        teamIds = teamCodes.map((code: string) => {
          const t = allTeams.find(team => team.codigo.toUpperCase() === code);
          return t ? t._id as Types.ObjectId : null;
        }).filter((id: Types.ObjectId | null) => id !== null);
      }
      
      bulks.push({
        codigo: g.codigo,
        nombre: g.nombre,
        eventoId: new Types.ObjectId(eventoId),
        teams: teamIds
      });
    }

    return this.groupModel.insertMany(bulks);
  }

  async addTeamToGroup(groupId: string, teamId: string): Promise<GroupDocument> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Grupo no encontrado');
    
    if (!group.teams.includes(teamId)) {
      group.teams.push(new Types.ObjectId(teamId));
      await group.save();
    }
    return group.populate('teams');
  }

  // --- Matches ---
  async getEventMatches(eventoId: string): Promise<MatchDocument[]> {
    return this.matchModel.find({ eventoId }).populate('localTeamId').populate('visitanteTeamId').populate('grupoId').sort({ fechaHora: 1 }).exec();
  }

  async createMatchesBulk(eventoId: string, matches: any[]): Promise<any> {
    const teams = await this.teamModel.find({ eventoId }).exec();
    const groups = await this.groupModel.find({ eventoId }).exec();
    
    const bulks = [];
    for (const m of matches) {
      const localTeam = teams.find(t => t.codigo.toUpperCase() === m.local?.toUpperCase());
      const visTeam = teams.find(t => t.codigo.toUpperCase() === m.visitante?.toUpperCase());
      const grupo = groups.find(g => g.codigo.toUpperCase() === m.grupo?.toUpperCase());

      if (localTeam && visTeam) {
        bulks.push({
          eventoId: new Types.ObjectId(eventoId),
          grupoId: grupo ? grupo._id : undefined,
          localTeamId: localTeam._id,
          visitanteTeamId: visTeam._id,
          fechaHora: m.fechaHora ? new Date(m.fechaHora) : new Date(),
          fase: m.fase || 'GRUPOS',
          estado: MatchState.PENDIENTE
        });
      } else {
        console.warn(`Partido omitido por falta de equipo: ${m.local} vs ${m.visitante}`);
      }
    }
    
    if (bulks.length === 0) {
      return { message: 'Ningún partido procesado. Verifica que los códigos de los equipos coincidan exactamente con los registrados.' };
    }
    
    return this.matchModel.insertMany(bulks);
  }

  // --- FIFA Standings ---
  async getGroupStandings(groupId: string): Promise<any[]> {
    // 1. Obtener grupo con sus equipos
    const group = await this.groupModel.findById(groupId).populate('teams');
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const teams = group.teams as any[];
    
    // 2. Inicializar la tabla
    const table = teams.map(t => ({
      teamId: t._id,
      codigo: t.codigo,
      nombre: t.nombre,
      escudoUrl: t.escudoUrl,
      pts: 0,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      gd: 0
    }));

    // 3. Obtener partidos JUGADOS de este grupo
    const matches = await this.matchModel.find({
      grupoId: groupId,
      estado: MatchState.JUGADO
    }).exec();

    // 4. Calcular estadísticas
    matches.forEach(m => {
      const gLocal = m.golesLocal || 0;
      const gVis = m.golesVisitante || 0;
      
      const localRow = table.find(r => r.teamId.toString() === m.localTeamId.toString());
      const visRow = table.find(r => r.teamId.toString() === m.visitanteTeamId.toString());

      if (localRow && visRow) {
        localRow.pj++;
        visRow.pj++;

        localRow.gf += gLocal;
        localRow.gc += gVis;
        visRow.gf += gVis;
        visRow.gc += gLocal;

        if (gLocal > gVis) {
          localRow.pts += 3;
          localRow.pg++;
          visRow.pp++;
        } else if (gLocal < gVis) {
          visRow.pts += 3;
          visRow.pg++;
          localRow.pp++;
        } else {
          localRow.pts += 1;
          visRow.pts += 1;
          localRow.pe++;
          visRow.pe++;
        }
      }
    });

    // 5. Calcular diferencia de goles y Ordenar Reglas FIFA
    table.forEach(r => r.gd = r.gf - r.gc);

    table.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts; // 1. Puntos
      if (b.gd !== a.gd) return b.gd - a.gd;    // 2. Diferencia de Goles
      if (b.gf !== a.gf) return b.gf - a.gf;    // 3. Goles a Favor
      return a.nombre.localeCompare(b.nombre);  // 4. Orden alfabético de desempate extra
    });

    return table;
  }
}
