import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY não configurada.');
    }
    this.resend = new Resend(apiKey);
    this.from =
      this.configService.get<string>('MAIL_FROM') ||
      'Lista de Presentes <onboarding@resend.dev>';
  }

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail via Resend:', error);
      throw error;
    }
  }
}
