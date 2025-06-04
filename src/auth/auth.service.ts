// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async validateAdmin(password: string): Promise<boolean> {
        const admin = await this.prisma.admin.findFirst();
        if (!admin) {
            throw new UnauthorizedException('Admin not configured');
        }

        const isValid = await argon2.verify(admin.password, password);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return true;
    }

    async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
        const { username, password } = loginDto;

        const admin = await this.prisma.admin.findUnique({
            where: { username },
        });

        if (!admin) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const isPasswordValid = await argon2.verify(admin.password, password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const payload = { username: admin.username };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}