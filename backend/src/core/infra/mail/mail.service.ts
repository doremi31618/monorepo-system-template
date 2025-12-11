import { Injectable, Logger , Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { type DB, schema } from '../db/db.js';

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);
	private readonly transporter: nodemailer.Transporter;

	constructor(@Inject('DB') private readonly db: DB) {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT ?? 465),
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		});
	}

	async sendResetPasswordEmail(to: string, resetLink: string) {
		const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
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
			await this.db.insert(schema.mailLogs).values({
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
