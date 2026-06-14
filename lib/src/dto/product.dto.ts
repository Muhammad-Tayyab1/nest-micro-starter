import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Widget Pro' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A very useful widget' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @IsPositive()
  price: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
