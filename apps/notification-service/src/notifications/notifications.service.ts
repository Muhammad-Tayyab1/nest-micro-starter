import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendNotificationDto) {
    const record = await this.prisma.notification.create({ data: dto });
    this.logger.log(`[MOCK] Sent to ${dto.to} — "${dto.subject}"`);
    return record;
  }
}
