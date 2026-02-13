import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mailHost'),
      port: this.config.get<number>('mailPort'),
      secure: false,
      auth: {
        user: this.config.get<string>('mailUser'),
        pass: this.config.get<string>('mailPass')
      }
    });
  }

  async sendAltEmailVerification(primaryEmail: string, alternateEmail: string) {
    const from = this.config.get<string>('mailFrom');
    await this.transporter.sendMail({
      from,
      to: alternateEmail,
      subject: 'Verify your alternate email',
      text: `Verify your alternate email for ${primaryEmail}. If you did not request this, ignore this message.`
    });
  }

  async sendInviteEmail(inviterEmail: string, inviteeEmail: string) {
    const from = this.config.get<string>('mailFrom');
    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:5173';
    await this.transporter.sendMail({
      from,
      to: inviteeEmail,
      subject: 'You have been invited to Chat App',
      text: `${inviterEmail} invited you to join Chat App. Sign up here: ${appUrl}`
    });
  }
}
