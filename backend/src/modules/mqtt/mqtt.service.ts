import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';

export interface FeedEventPayload {
  eventId: string;
  commandId?: string;
  source: 'manual_app' | 'button' | 'schedule';
  status: 'completed' | 'interrupted';
  durationMs: number;
  actuationCompleted: boolean;
}

export interface DeviceStatePayload {
  deviceId: string;
  online: boolean;
  state: string;
  rtcValid: boolean;
  uptimeSeconds: number;
  rtcTime?: string;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  public readonly events = new EventEmitter();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const brokerUrl = this.configService.get<string>(
      'MQTT_BROKER_URL',
      'mqtt://localhost:1883',
    );
    const clientId = this.configService.get<string>(
      'MQTT_CLIENT_ID',
      'pet_feeder_backend_server',
    );

    this.logger.log(`Connecting to MQTT broker at ${brokerUrl}...`);

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        reconnectPeriod: 5000,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        this.logger.log('Successfully connected to MQTT broker.');

        // Subscribe to device events and status topics
        this.client?.subscribe('feeders/+/event/feed', { qos: 1 });
        this.client?.subscribe('feeders/+/state', { qos: 0 });
        this.client?.subscribe('feeders/+/availability', { qos: 1 });
      });

      this.client.on('message', (topic, payload) => {
        this.handleIncomingMessage(topic, payload.toString());
      });

      this.client.on('error', (err) => {
        this.logger.warn(`MQTT connection error: ${err.message}`);
      });
    } catch (err: unknown) {
      this.logger.warn(
        `Could not initialize MQTT client: ${(err as Error)?.message}`,
      );
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end(true);
      this.logger.log('Disconnected from MQTT broker.');
    }
  }

  private handleIncomingMessage(topic: string, message: string) {
    try {
      const parts = topic.split('/');
      const deviceId = parts[1];
      const category = parts[2];
      const action = parts[3];

      if (category === 'event' && action === 'feed') {
        const data: FeedEventPayload = JSON.parse(message);
        this.logger.log(
          `[MQTT IN] 📥 Feed completion event received from ${deviceId}: source=${data.source}, duration=${data.durationMs}ms, status=${data.status}`,
        );
        this.events.emit('feedEvent', { deviceId, ...data });
      } else if (category === 'state') {
        const data: DeviceStatePayload = JSON.parse(message);
        this.events.emit('deviceState', { ...data, deviceId });
      } else if (category === 'availability') {
        const isOnline = message.trim().toLowerCase() === 'online';
        this.logger.log(`[MQTT IN] ⚡ Device ${deviceId} availability: ${message}`);
        this.events.emit('deviceAvailability', { deviceId, isOnline });
      }
    } catch (err: unknown) {
      this.logger.error(
        `Failed to parse MQTT message on ${topic}: ${(err as Error)?.message}`,
      );
    }
  }

  /**
   * Publishes a feed command to the ESP32 hardware via MQTT.
   */
  publishFeedCommand(deviceId: string, commandId: string, durationMs: number): boolean {
    if (!this.client || !this.client.connected) {
      this.logger.warn(
        `Cannot publish feed command to ${deviceId}: MQTT client not connected.`,
      );
      return false;
    }

    const topic = `feeders/${deviceId}/cmd/feed`;
    const payload = JSON.stringify({
      commandId,
      durationMs,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });

    this.client.publish(topic, payload, { qos: 1 });
    this.logger.log(`[MQTT OUT] 🚀 Published feed command to topic '${topic}' (${durationMs}ms)`);
    return true;
  }

  /**
   * Publishes desired configuration (schedules, settings) to ESP32 for offline storage.
   */
  publishDesiredConfig(deviceId: string, config: Record<string, unknown>): boolean {
    if (!this.client || !this.client.connected) {
      return false;
    }

    const topic = `feeders/${deviceId}/config/desired`;
    const payload = JSON.stringify(config);

    this.client.publish(topic, payload, { qos: 1, retain: true });
    this.logger.log(`Published desired config to ${topic}`);
    return true;
  }
}
