// src/gifts/dto/reserve-guest.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReserveGuestDto {
    @ApiProperty({ example: 'João Silva' })
    name: string;

    @ApiProperty({ example: 'joao.silva@example.com' })
    email: string;
}