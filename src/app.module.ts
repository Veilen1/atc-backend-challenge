import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { HttpModule } from '@nestjs/axios';


import { GetAvailabilityHandler } from './domain/handlers/get-availability.handler';
import { ClubUpdatedHandler } from './domain/handlers/club-updated.handler';
import { AVAILABILITY_REPOSITORY } from './domain/ports/availability-repository';
import { ALQUILA_TU_CANCHA_CLIENT } from './domain/ports/aquila-tu-cancha.client';
import { HTTPAlquilaTuCanchaClient } from './infrastructure/clients/http-alquila-tu-cancha.client';
import { EventsController } from './infrastructure/controllers/events.controller';
import { SearchController } from './infrastructure/controllers/search.controller';
import { RedisAvailabilityRepository } from './infrastructure/repositories/redis-availability.repository';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    CqrsModule,
    ScheduleModule.forRoot(), // Permite crear tareas en segundo plano (Cron Jobs)
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
        }),
      }),
    }),
  ],
  controllers: [SearchController, EventsController],
  providers: [
    HTTPAlquilaTuCanchaClient,
    {
      provide: ALQUILA_TU_CANCHA_CLIENT,
      useClass: HTTPAlquilaTuCanchaClient,
    },
    {
      provide: AVAILABILITY_REPOSITORY,
      useClass: RedisAvailabilityRepository, // Aquí le decimos que use Redis para el repositorio
    },
    GetAvailabilityHandler,
    ClubUpdatedHandler,
  ],
})
export class AppModule { }
