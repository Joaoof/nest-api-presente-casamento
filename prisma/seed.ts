// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando seed...');

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'senha123';

    console.log(`🔍 Verificando admin: ${ADMIN_USERNAME}`);

    const existingAdmin = await prisma.admin.findUnique({
        where: { username: ADMIN_USERNAME },
    });

    if (existingAdmin) {
        console.log(`✅ Admin "${ADMIN_USERNAME}" já existe.`);
        return;
    }

    const hashedPassword = await argon2.hash(ADMIN_PASSWORD);
    console.log('🔐 Senha criptografada.');

    const admin = await prisma.admin.create({
        data: {
            username: ADMIN_USERNAME,
            password: hashedPassword,
            salt: '',
        },
    });

    console.log('🎉 Admin criado:', admin);
}

main()
    .catch(async (e) => {
        console.error('❌ Erro ao executar seed:', e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });