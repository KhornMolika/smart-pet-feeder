import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  
  // Database configuration
  DATABASE_TYPE: Joi.string().valid('postgres', 'sqljs').default('sqljs'),
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5433),
  DATABASE_USER: Joi.string().default('feeder'),
  DATABASE_PASSWORD: Joi.string().default('feeder_secret'),
  DATABASE_NAME: Joi.string().default('smart_pet_feeder'),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(true),
  SQLITE_DATABASE_PATH: Joi.string().default('./data/feeder.sqlite'),

  // MQTT Broker
  MQTT_BROKER_URL: Joi.string().default('mqtt://localhost:1883'),
  MQTT_CLIENT_ID: Joi.string().default('pet_feeder_backend_server'),

  // Telegram Bot integration
  TELEGRAM_BOT_TOKEN: Joi.string().allow('').default(''),

  // CORS whitelist
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});
