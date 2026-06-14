import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS, SendNotificationDto } from '@app/contracts';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(NOTIFICATION_PATTERNS.SEND)
  send(@Payload() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }
}
