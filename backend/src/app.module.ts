import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StickersModule } from './stickers/stickers.module';
import { CollectionsModule } from './collections/collections.module';
import { TradesModule } from './trades/trades.module';
import { MatchesModule } from './matches/matches.module';
import { PoolsModule } from './pools/pools.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/goalbum'),
    AuthModule, UsersModule, StickersModule, CollectionsModule, TradesModule, MatchesModule, PoolsModule, EventsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
