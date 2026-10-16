"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransporter = getTransporter;
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
function getTransporter() {
    if (!transporter) {
        const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = process.env.SMTP_SECURE === 'true';
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASSWORD || '';
        transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
        });
    }
    return transporter;
}
async function sendMail(options) {
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
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info) || undefined;
        if (previewUrl) {
            console.log(`Email sent preview URL: ${previewUrl}`);
        }
        return {
            accepted: info.accepted.length > 0,
            messageId: info.messageId,
            previewUrl,
        };
    }
    catch (error) {
        console.error('SMTP send error:', error);
        return {
            accepted: false,
            error: error.message || 'SMTP transmission failure',
        };
    }
}
