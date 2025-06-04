import { Admin } from '@prisma/client';
import { Request } from 'express';

declare global {
    interface Request {
        user?: {
            username: string;
            sub: string; // id do admin
        };
    }
}