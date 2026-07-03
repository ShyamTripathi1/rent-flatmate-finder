import nodemailer from 'nodemailer';
import { config } from '../config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    console.log('Using configured SMTP transporter:', config.smtp.host);
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    console.log('No SMTP config provided. Creating an Ethereal Email test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('==================================================');
      console.log('Ethereal email test account created for dev debugging!');
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
      console.log('==================================================');
    } catch (err) {
      console.error('Failed to create Ethereal Email test account, falling back to console dummy mailer', err);
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log('\n--- [CONSOLE DUMMY EMAIL OUTBOX] ---');
          console.log(`From: ${mailOptions.from}`);
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body: \n${mailOptions.text}`);
          console.log('-------------------------------------\n');
          return { messageId: 'dummy-console-message-id-' + Date.now() };
        }
      } as any;
    }
  }

  return transporter!;
}

export async function sendEmail({
  to,
  userId,
  type,
  subject,
  text,
  html,
}: {
  to: string;
  userId: string;
  type: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    const activeTransporter = await getTransporter();
    const info = await activeTransporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    const isEthereal = activeTransporter.options && (activeTransporter.options as any).host === 'smtp.ethereal.email';
    let previewUrl = '';
    if (isEthereal && info) {
      previewUrl = nodemailer.getTestMessageUrl(info) || '';
      console.log(`Email Sent! Preview at: ${previewUrl}`);
    } else {
      console.log(`Email Sent! Message ID: ${info.messageId}`);
    }

    // Log to DB for audit
    await prisma.notificationLog.create({
      data: {
        userId,
        type,
        payload: JSON.stringify({
          to,
          subject,
          messageId: info.messageId,
          ...(previewUrl ? { previewUrl } : {})
        }),
        status: 'SUCCESS',
      },
    });

    return info;
  } catch (err: any) {
    console.error('Error sending email:', err);
    try {
      await prisma.notificationLog.create({
        data: {
          userId,
          type,
          payload: JSON.stringify({ to, subject, error: err.message || err }),
          status: 'FAILED',
        },
      });
    } catch (dbErr) {
      console.error('Failed to write failure log to database:', dbErr);
    }
    // We do NOT crash the thread, per requirements "Handle errors gracefully everywhere, especially LLM and email service failures (must never crash the app)"
    return null;
  }
}
export default sendEmail;
