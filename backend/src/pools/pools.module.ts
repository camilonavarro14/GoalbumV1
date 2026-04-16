import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolsService } from './pools.service';
import { PoolsController } from './pools.controller';
import { Pool, PoolSchema } from './schemas/pool.schema';
import { Prediction, PredictionSchema } from './schemas/prediction.schema';
import { Match, MatchSchema } from '../matches/schemas/match.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pool.name, schema: PoolSchema },
      { name: Prediction.name, schema: PredictionSchema },
      { name: Match.name, schema: MatchSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema }
    ]),
  ],
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
