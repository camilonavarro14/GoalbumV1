import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Get()
  async getEvents() {
    return this.eventsService.getEvents();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(@Body() body: any) {
    return this.eventsService.createEvent(body);
  }

  // --- Teams ---
  @Get(':eventoId/teams')
  async getTeams(@Param('eventoId') eventoId: string) {
    return this.eventsService.getTeams(eventoId);
  }

  @Post(':eventoId/teams/bulk')
  @UseGuards(JwtAuthGuard)
  async createTeamsBulk(@Param('eventoId') eventoId: string, @Body() body: any) {
    return this.eventsService.createTeamsBulk(eventoId, body.teams);
  }

  // --- Groups ---
  @Get(':eventoId/groups')
  async getGroups(@Param('eventoId') eventoId: string) {
    return this.eventsService.getGroups(eventoId);
  }

  @Post(':eventoId/groups')
  @UseGuards(JwtAuthGuard)
  async createGroup(@Param('eventoId') eventoId: string, @Body() body: any) {
    return this.eventsService.createGroup(eventoId, body);
  }

  @Post(':eventoId/groups/bulk')
  @UseGuards(JwtAuthGuard)
  async createGroupsBulk(@Param('eventoId') eventoId: string, @Body() body: any) {
    return this.eventsService.createGroupsBulk(eventoId, body.groups);
  }

  // --- Matches ---
  @Post(':eventoId/matches/bulk')
  @UseGuards(JwtAuthGuard)
  async createMatchesBulk(@Param('eventoId') eventoId: string, @Body() body: any) {
    return this.eventsService.createMatchesBulk(eventoId, body.matches);
  }

  @Get(':eventoId/matches')
  async getEventMatches(@Param('eventoId') eventoId: string) {
    return this.eventsService.getEventMatches(eventoId);
  }

  @Put(':eventoId/groups/:groupId/teams')
  @UseGuards(JwtAuthGuard)
  async addTeamToGroup(
    @Param('groupId') groupId: string,
    @Body('teamId') teamId: string
  ) {
    return this.eventsService.addTeamToGroup(groupId, teamId);
  }

  // --- FIFA Standings ---
  @Get(':eventoId/groups/:groupId/standings')
  async getGroupStandings(@Param('groupId') groupId: string) {
    return this.eventsService.getGroupStandings(groupId);
  }
}
