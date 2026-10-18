import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { envValidationSchema } from './config/env.validation.js';
import { Device } from './modules/devices/entities/device.entity.js';
import { DeviceSettings } from './modules/devices/entities/device-settings.entity.js';
import { DeviceMember } from './modules/devices/entities/device-member.entity.js';
import { FeedingSchedule } from './modules/feeder/entities/feeding-schedule.entity.js';
import { FeedCommand } from './modules/feeder/entities/feed-command.entity.js';
import { FeedingEvent } from './modules/feeder/entities/feeding-event.entity.js';

import { MqttModule } from './modules/mqtt/mqtt.module.js';
import { DevicesModule } from './modules/devices/devices.module.js';
import { FeederModule } from './modules/feeder/feeder.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { TelegramModule } from './modules/telegram/telegram.module.js';

@Module({
  imports: [
    // Environment Configuration with Joi Schema Validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Rate Limiting (Throttler)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    // Dynamic TypeORM Database Connection (Supports sql.js for instant dev & PostgreSQL for production/docker)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbType = config.get<string>('DATABASE_TYPE', 'sqljs');
        const entities = [
          Device,
          DeviceSettings,
          DeviceMember,
          FeedingSchedule,
          FeedCommand,
          FeedingEvent,
        ];
        const synchronize = config.get<boolean>('DATABASE_SYNCHRONIZE', true);
        const logging = config.get<string>('NODE_ENV') === 'development';

        if (dbType === 'sqljs') {
          return {
            type: 'sqljs',
            location: config.get<string>('SQLITE_DATABASE_PATH', './data/feeder.sqlite'),
            autoSave: true,
            entities,
            synchronize,
            autoLoadEntities: true,
            logging: false,
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5433),
          username: config.get<string>('DATABASE_USER', 'feeder'),
          password: config.get<string>('DATABASE_PASSWORD', 'feeder_secret'),
          database: config.get<string>('DATABASE_NAME', 'smart_pet_feeder'),
          entities,
          synchronize,
          autoLoadEntities: true,
          logging,
        };
      },
    }),

    // Global Core and Feature Modules
    MqttModule,
    DevicesModule,
    FeederModule,
    HealthModule,
    TelegramModule,
  ],
})
export class AppModule {}
