import { registerAs } from "@nestjs/config";

export type MailConfig = {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}

export default registerAs('mail', ():MailConfig => {
    return {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
    }
})
