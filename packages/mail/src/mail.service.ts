import { Injectable, Logger , Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Database } from '@platform/database';
import { mailLogs } from './mail.schema.js';
// import { ConfigService } from '@nestjs/config';
import mailConfig from './mail.config.js';
import { type ConfigType } from '@nestjs/config';

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);
	private readonly transporter: nodemailer.Transporter;

	private readonly from: string;
	constructor(
		@Inject(mailConfig.KEY) private readonly config: ConfigType<typeof mailConfig>,
		@Inject('DB') private readonly db: Database) {
		this.from = this.config.from;
		this.transporter = nodemailer.createTransport({
			host: this.config.host,
			port: Number(this.config.port),
			secure: true,
			auth: {
				user: this.config.user,
				pass: this.config.pass
			}
		});
	}

	async sendResetPasswordEmail(to: string, resetLink: string) {
		const from = this.from;
		const subject = 'Reset your password';
		const html = `
			<p>You requested a password reset.</p>
			<p>Click the link below to set a new password (valid for a limited time):</p>
			<p><a href="${resetLink}">${resetLink}</a></p>
			<p>If you did not request this, you can ignore this email.</p>
		`;
		try {
			const info = await this.transporter.sendMail({ from, to, subject, html });
			await this.logMail({
				mailFrom: from,
				mailTo: to,
				cc: null,
				subject,
				content: html,
				status: 'sent'
			});
			this.logger.debug(`Mail sent: ${info.messageId}`);
		} catch (error) {
			this.logger.error('Failed to send reset password email', error as Error);
			await this.logMail({
				mailFrom: from,
				mailTo: to,
				cc: null,
				subject,
				content: html,
				status: 'failed'
			});
			throw error;
		}
	}

	private async logMail({
		mailFrom,
		mailTo,
		cc,
		subject,
		content,
		status
	}: {
		mailFrom: string;
		mailTo: string;
		cc: string | null;
		subject: string;
		content: string;
		status: string;
	}) {
		try {
			await this.db.insert(mailLogs).values({
				mailFrom,
				mailTo,
				cc: cc ?? undefined,
				subject,
				content,
				status
			});
		} catch (error) {
			this.logger.error('Failed to log mail', error as Error);
		}
	}
}
