import { ApiProperty } from '@nestjs/swagger';

export class GiftResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false, example: 'https://exemplo.com/image.jpg' })
  imageUrl?: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  priority: string;

  @ApiProperty({ enum: ['available', 'reserved'] })
  status: string;

  @ApiProperty({ required: false, example: 'João Silva <joao@example.com>' })
  reservedBy?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}