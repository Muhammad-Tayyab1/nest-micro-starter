import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS, SendNotificationDto } from '@app/contracts';

@Injectable()
export class NotificationsService {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy) {}

  send(dto: SendNotificationDto) {
    // TCP emit is fire-and-forget — no response is expected.
    // Unlike a message queue, this is NOT durable: if the notification service
    // is unreachable, the event is lost. Swap TCP for NATS/RabbitMQ for durability.
    this.notificationClient.emit(NOTIFICATION_PATTERNS.SEND, dto);
    return { sent: true };
  }
}
