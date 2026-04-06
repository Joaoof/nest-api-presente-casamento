import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class UpdateGiftImageDto {
    @ApiProperty({
        example: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
        description: 'URL da nova imagem do presente',
    })
    @IsUrl({}, { message: 'imageUrl deve ser uma URL válida' })
    @IsNotEmpty({ message: 'imageUrl não pode ser vazia' })
    imageUrl: string;
}
