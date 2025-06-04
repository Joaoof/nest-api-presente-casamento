// gifts/gifts.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GiftResponseDto } from './dto/gift-response.dto';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { Request as ReqDecorator } from '@nestjs/common';
import { ReserveGuestDto } from './dto/reserve-guest.dto';

@ApiTags('gifts')
@Controller('gifts')
export class GiftsController {
    constructor(private readonly giftsService: GiftsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Criar um novo presente' })
    @ApiBody({ type: CreateGiftDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Presente criado com sucesso',
        type: GiftResponseDto,
    })
    async create(
        @Body() createGiftDto: CreateGiftDto,
        @ReqDecorator() req: any,
    ): Promise<GiftResponseDto> {
        const adminId = req.user.username.id  // ou o campo que contém o ID do admin

        console.log(adminId);


        const gift = await this.giftsService.create(createGiftDto, adminId);
        return {
            ...gift,
            imageUrl: gift.imageUrl === null ? undefined : gift.imageUrl,
            reservedBy: gift.reservedBy === null ? undefined : gift.reservedBy,
        };
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os presentes' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lista de presentes retornada com sucesso',
        type: [GiftResponseDto],
    })
    async findAll(): Promise<GiftResponseDto[]> {
        const gifts = await this.giftsService.findAll();
        console.log(gifts);

        return gifts.map((gift) => ({
            ...gift,
            imageUrl: gift.imageUrl === null ? undefined : gift.imageUrl,
            reservedBy: gift.reservedBy === null ? undefined : gift.reservedBy,
        }));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar presente por ID' })
    @ApiParam({ name: 'id', description: 'ID do presente' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Dados do presente',
        type: GiftResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Presente não encontrado',
    })
    async findOne(@Param('id') id: string): Promise<GiftResponseDto> {
        const gift = await this.giftsService.findOne(id);
        return {
            ...gift,
            imageUrl: gift.imageUrl === null ? undefined : gift.imageUrl,
            reservedBy: gift.reservedBy === null ? undefined : gift.reservedBy,
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Atualizar um presente' })
    @ApiParam({ name: 'id', description: 'ID do presente' })
    @ApiBody({ type: UpdateGiftDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Presente atualizado com sucesso',
        type: GiftResponseDto,
    })
    async update(
        @Param('id') id: string,
        @Body() updateGiftDto: UpdateGiftDto,
    ): Promise<GiftResponseDto> {
        const updatedGift = await this.giftsService.update(id, updateGiftDto);
        return {
            ...updatedGift,
            imageUrl: updatedGift.imageUrl === null ? undefined : updatedGift.imageUrl,
            reservedBy: updatedGift.reservedBy === null ? undefined : updatedGift.reservedBy,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remover um presente' })
    @ApiParam({ name: 'id', description: 'ID do presente' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Presente removido com sucesso',
        type: GiftResponseDto,
    })
    async remove(@Param('id') id: string): Promise<GiftResponseDto> {
        const removedGift = await this.giftsService.remove(id);
        return {
            ...removedGift,
            imageUrl: removedGift.imageUrl === null ? undefined : removedGift.imageUrl,
            reservedBy: removedGift.reservedBy === null ? undefined : removedGift.reservedBy,
        };
    }

    @Post(':id/reserve')
    @ApiOperation({ summary: 'Reservar um presente' })
    @ApiParam({ name: 'id', description: 'ID do presente' })
    @ApiBody({
        schema: {
            example: {
                reservedBy: 'João Silva <joao@email.com>',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Presente reservado com sucesso',
        type: GiftResponseDto,
    })
    async reserve(
        @Param('id') id: string,
        @Body('reservedBy') reservedBy: string,
    ): Promise<GiftResponseDto> {
        const reservedGift = await this.giftsService.reserveGift(id, reservedBy);
        console.log(reservedGift);

        return {
            ...reservedGift,
            imageUrl: reservedGift.imageUrl ?? undefined,
            reservedBy: reservedGift.reservedBy ?? undefined,
        };
    }
}