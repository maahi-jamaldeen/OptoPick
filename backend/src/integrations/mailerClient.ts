import nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASSWORD || '';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
  return transporter;
}

export async function sendMail(options: MailOptions): Promise<{ accepted: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  try {
    const from = process.env.SMTP_FROM || '"Indian Optician" <notifications@indianoptician.lk>';
    const transport = getTransporter();

    // If using default placeholder credentials without actual SMTP auth, log safely
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_smtp_user') {
      console.log('--- [MOCK EMAIL DISPATCH] ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text}`);
      console.log('-----------------------------');
      return { accepted: true, messageId: `mock-${Date.now()}` };
    }

    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`Email sent preview URL: ${previewUrl}`);
    }

    return {
      accepted: info.accepted.length > 0,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error('SMTP send error:', error);
    return {
      accepted: false,
      error: error.message || 'SMTP transmission failure',
    };
  }
}
