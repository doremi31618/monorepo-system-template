import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

const shouldRunIntegration = process.env.RUN_SMTP_TEST === 'true';
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration('SMTP integration test', () => {
	it('sends an email using the configured SMTP server', async () => {
		const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } =
			process.env;

		if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
			throw new Error('Missing SMTP configuration in environment variables.');
		}

		const port = Number(SMTP_PORT);
		const secure = process.env.SMTP_SECURE
			? process.env.SMTP_SECURE === 'true'
			: port === 465;

		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port,
			secure,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS
			}
		});

		const to = process.env.MAIL_TEST_TO ?? MAIL_FROM;
		const info = await transporter.sendMail({
			from: MAIL_FROM,
			to,
			subject: '[SMTP integration] Hello via Jest',
			text: `Hi (sent at ${new Date().toISOString()})`,
			html: `<p>Hi (sent at ${new Date().toISOString()})</p>`
		});

		expect(info.accepted).toContain(to);
	}, 20_000);
});
