import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import Mail from 'nodemailer/lib/mailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private transporter: Mail;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'Gmail',
            secure: true,
            auth: {
                user: '발신 이메일',
                pass: '앱 비밀번호',
            },
        });
    }

    async sendVerifyToken(email: string, verifyToken: number) {
        const mailOptions: EmailOptions = {
            to: email,
            subject: '이메일 확인',
            html: `인증번호 ${verifyToken}`,
        }

        return this.transporter.sendMail(mailOptions);
    }
}
