import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS, SendNotificationDto } from '@app/contracts';

@Injectable()
export class NotificationsService {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy) {}

  send(dto: SendNotificationDto) {
    this.notificationClient.emit(NOTIFICATION_PATTERNS.SEND, dto);
    return { queued: true };
  }
}
