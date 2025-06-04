// gifts/dto/create-gift.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class CreateGiftDto {
    @ApiProperty({ example: 'Panela de pressão' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Panela elétrica multifunções' })
    @IsString()
    description: string;

    @ApiProperty({ example: 199.9 })
    @IsNumber()
    @IsOptional()
    price?: number;

    @ApiProperty({ example: 'https://exemplo.com/panela.jpg', required: false })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: 'João e Maria' })
    @IsString()
    @IsOptional()
    reservedBy?: string;

    @ApiProperty({ example: 'high | medium | low', required: false })
    @IsString()
    @IsOptional()
    priority?: string;
}