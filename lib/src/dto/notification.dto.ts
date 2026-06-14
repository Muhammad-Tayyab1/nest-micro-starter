import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Welcome!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Hello, welcome to our platform.' })
  @IsString()
  body: string;
}
