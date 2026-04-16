import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { Team, TeamSchema } from './schemas/team.schema';
import { Group, GroupSchema } from './schemas/group.schema';
import { Match, MatchSchema } from '../matches/schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Match.name, schema: MatchSchema },
    ])
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService]
})
export class EventsModule {}
