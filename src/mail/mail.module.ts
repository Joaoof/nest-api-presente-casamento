import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
    providers: [MailService],
    exports: [MailService], // 👈 isso é necessário pra que outros módulos vejam o serviço
})
export class MailModule { }
    