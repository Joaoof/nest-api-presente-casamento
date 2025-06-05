import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587, // Default to 587 if MAIL_PORT is not set
        secure: false, // Set to true if using port 465
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    async sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
        await this.transporter.sendMail({
            from: `"Lista de Presentes" <${process.env.MAIL_FROM}>`,
            to,
            subject,
            html,
        });
    }
}
