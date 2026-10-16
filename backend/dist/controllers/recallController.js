"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecallCandidates = getRecallCandidates;
exports.generateRecallDraft = generateRecallDraft;
exports.approveAndDispatch = approveAndDispatch;
const db_js_1 = __importDefault(require("../config/db.js"));
const zod_1 = require("zod");
const geminiClient_js_1 = require("../integrations/geminiClient.js");
const mailerClient_js_1 = require("../integrations/mailerClient.js");
const security_js_1 = require("../utils/security.js");
const generateDraftSchema = zod_1.z.object({
    customer_id: zod_1.z.coerce.number().int().positive().optional(),
    customerId: zod_1.z.coerce.number().int().positive().optional(),
    comm_type: zod_1.z.enum(['ORDER_READY', 'ANNUAL_REVIEW_RECALL', 'LAPSED_RETENTION', 'PROMOTIONAL', 'EYE_EXAM_DUE']).optional(),
    communication_type: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    channel: zod_1.z.enum(['EMAIL', 'SMS', 'WHATSAPP']).optional().default('EMAIL'),
    related_sale_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    relatedSaleId: zod_1.z.coerce.number().int().positive().optional().nullable(),
    customContext: zod_1.z.string().optional(),
});
const approveMessageSchema = zod_1.z.object({
    communication_id: zod_1.z.coerce.number().int().positive().optional(),
    customer_id: zod_1.z.coerce.number().int().positive().optional(),
    communication_type: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
    message_body: zod_1.z.string().optional(),
    related_sale_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    edited_subject: zod_1.z.string().min(1).max(200).optional(),
    edited_body: zod_1.z.string().min(1).optional(),
});
async function getRecallCandidates(req, res) {
    // 1. Ready for Collection
    const [readyOrders] = await db_js_1.default.query(`SELECT s.id as sale_id, s.sale_number, s.balance_amount, s.order_status,
            c.id as customer_id, c.customer_code, c.full_name as customer_name, c.phone_number, c.email
     FROM sales s
     JOIN customers c ON c.id = s.customer_id
     WHERE s.order_status IN ('RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION')
     ORDER BY s.updated_at DESC`);
    // 2. Annual Eye Review Due (>12 months since examination)
    const [dueReviews] = await db_js_1.default.query(`SELECT c.id as customer_id, c.customer_code, c.full_name as customer_name, c.phone_number, c.email,
            MAX(e.exam_date) as last_exam_date,
            TIMESTAMPDIFF(MONTH, MAX(e.exam_date), CURDATE()) as months_since_exam
     FROM customers c
     JOIN examinations e ON e.customer_id = c.id
     GROUP BY c.id
     HAVING months_since_exam >= 12
     ORDER BY months_since_exam DESC`);
    // 3. Lapsed Customers (>24 months without purchase or visit)
    const [lapsedCustomers] = await db_js_1.default.query(`SELECT c.id as customer_id, c.customer_code, c.full_name as customer_name, c.phone_number, c.email,
            MAX(s.created_at) as last_purchase_date,
            TIMESTAMPDIFF(MONTH, COALESCE(MAX(s.created_at), c.created_at), CURDATE()) as months_inactive
     FROM customers c
     LEFT JOIN sales s ON s.customer_id = c.id
     GROUP BY c.id
     HAVING months_inactive >= 24
     ORDER BY months_inactive DESC`);
    res.json({
        success: true,
        data: {
            ready_orders: readyOrders,
            due_reviews: dueReviews,
            lapsed_customers: lapsedCustomers,
        }
    });
}
async function generateRecallDraft(req, res) {
    try {
        const parsed = generateDraftSchema.parse(req.body);
        const customer_id = parsed.customer_id || parsed.customerId;
        if (!customer_id) {
            res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'customer_id is required' } });
            return;
        }
        const comm_type = parsed.comm_type || parsed.communication_type || parsed.type || 'ANNUAL_REVIEW_RECALL';
        const related_sale_id = parsed.related_sale_id || parsed.relatedSaleId || null;
        const channel = parsed.channel || 'EMAIL';
        const userId = req.user.id;
        const [custRows] = await db_js_1.default.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
        if (custRows.length === 0) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
            return;
        }
        const customer = custRows[0];
        let promptContext = `Customer ID: ${customer.customer_code}, Follow-up Type: ${comm_type}`;
        let defaultSubject = 'Important Eye Care Update from Indian Optician';
        let defaultBody = `Dear ${customer.full_name},\n\nWe hope this message finds you well. As part of our ongoing commitment to your optical health, we would like to remind you that your vision health check may be due for a review.\n\nPlease feel free to contact us or visit Indian Optician, Main Street, Nintavur.\n\nWarm regards,\nIndian Optician`;
        if (comm_type === 'ORDER_READY') {
            defaultSubject = 'Your Spectacles are Ready for Collection — Indian Optician';
            defaultBody = `Dear ${customer.full_name},\n\nWe are pleased to inform you that your custom eyewear order has been prepared and is ready for collection at Indian Optician, Main Street, Nintavur.\n\nPlease visit our center at your convenience for professional fitting.\n\nWarm regards,\nIndian Optician`;
        }
        else if (comm_type === 'ANNUAL_REVIEW_RECALL' || comm_type === 'EYE_EXAM_DUE') {
            defaultSubject = 'Annual Optical Review Due — Indian Optician';
            defaultBody = `Dear ${customer.full_name},\n\nOur records indicate that it has been over a year since your last comprehensive vision examination. Regular eye check-ups are essential to maintain optimal eye comfort and clear vision.\n\nWe invite you to schedule a consultation with our eye consultant at your convenience.\n\nWarm regards,\nIndian Optician, Nintavur\nHotline: +94 67 225 0123`;
        }
        else if (comm_type === 'LAPSED_RETENTION') {
            defaultSubject = 'A Warm Greeting from Indian Optician';
            defaultBody = `Dear ${customer.full_name},\n\nIt has been quite some time since your last visit to Indian Optician. We value your patronage and would love to welcome you back for a routine eye health review or frame maintenance.\n\nVisit us at Main Street, Nintavur.\n\nWarm regards,\nIndian Optician`;
        }
        // AI drafting (Privacy Safe: Zero PII transmitted)
        const prompt = `
You are OptoRecall, an AI patient communication drafting assistant for Indian Optician, Nintavur, Sri Lanka.
Draft an empathetic, polite, professional message for customer review.
Privacy Rules: Never assume severe eye illness. Use careful phrasing such as "may be due for a review". Never claim the customer definitely requires a new prescription or new spectacles.

CONTEXT (Pseudonymous):
${promptContext}

OUTPUT FORMAT (Raw JSON only, no markdown):
{
  "attention_level": "Routine" | "Medium" | "High",
  "reason": "string",
  "recommended_action": "string",
  "suggested_subject": "string",
  "suggested_body": "string"
}
`;
        let finalSubject = defaultSubject;
        let finalBody = defaultBody;
        try {
            const rawAi = await (0, geminiClient_js_1.generateContentWithGemini)(prompt);
            if (rawAi) {
                const sanitized = rawAi.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
                const parsed = JSON.parse(sanitized);
                if (parsed.suggested_subject && parsed.suggested_body) {
                    finalSubject = parsed.suggested_subject;
                    finalBody = parsed.suggested_body.replace(/\[Customer Name\]/g, customer.full_name);
                }
            }
        }
        catch (aiErr) {
            console.warn('Gemini recall drafting fallback to standard template:', aiErr);
        }
        // Insert draft in communications table
        const dbChannel = channel === 'EMAIL' ? 'EMAIL' : 'SMS_DRAFT';
        const [result] = await db_js_1.default.query(`INSERT INTO communications
       (customer_id, related_sale_id, comm_type, channel, recipient_contact, subject, message_body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT_PENDING_APPROVAL')`, [
            customer_id,
            related_sale_id || null,
            comm_type === 'EYE_EXAM_DUE' ? 'ANNUAL_REVIEW_RECALL' : comm_type,
            dbChannel,
            customer.email || customer.phone_number,
            finalSubject,
            finalBody,
        ]);
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                customer_id,
                customer_name: customer.full_name,
                recipient_contact: customer.email || customer.phone_number,
                comm_type,
                subject: finalSubject,
                message_body: finalBody,
                status: 'DRAFT_PENDING_APPROVAL',
            }
        });
    }
    catch (err) {
        console.error('generateRecallDraft error:', err);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Failed to generate recall draft' } });
    }
}
async function approveAndDispatch(req, res) {
    try {
        const parsed = approveMessageSchema.parse(req.body);
        const userId = req.user.id;
        let communication_id = parsed.communication_id;
        if (!communication_id && parsed.customer_id) {
            // Direct approval from candidate card (e.g. from UI)
            const [custRows] = await db_js_1.default.query('SELECT * FROM customers WHERE id = ?', [parsed.customer_id]);
            if (custRows.length === 0) {
                res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
                return;
            }
            const customer = custRows[0];
            const commType = parsed.communication_type || 'ANNUAL_REVIEW_RECALL';
            const dbChannel = parsed.channel === 'EMAIL' ? 'EMAIL' : 'SMS_DRAFT';
            const body = parsed.message_body || parsed.edited_body || 'Indian Optician eye check notice';
            const subject = parsed.edited_subject || 'Eye Care Notice — Indian Optician';
            const [inserted] = await db_js_1.default.query(`INSERT INTO communications
         (customer_id, related_sale_id, comm_type, channel, recipient_contact, subject, message_body, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT_PENDING_APPROVAL')`, [
                parsed.customer_id,
                parsed.related_sale_id || null,
                commType,
                dbChannel,
                customer.phone_number || customer.email || 'N/A',
                subject,
                body,
            ]);
            communication_id = inserted.insertId;
        }
        if (!communication_id) {
            res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'communication_id or customer_id is required' } });
            return;
        }
        const [commRows] = await db_js_1.default.query('SELECT c.*, cust.email, cust.full_name FROM communications c JOIN customers cust ON cust.id = c.customer_id WHERE c.id = ?', [communication_id]);
        if (commRows.length === 0) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Communication draft not found.' } });
            return;
        }
        const comm = commRows[0];
        const subject = parsed.edited_subject || comm.subject;
        const body = parsed.edited_body || parsed.message_body || comm.message_body;
        // Dispatch via Nodemailer if email exists and channel is EMAIL
        let sendResult = { accepted: true, error: undefined };
        if (comm.email && comm.channel === 'EMAIL') {
            sendResult = await (0, mailerClient_js_1.sendMail)({
                to: comm.email,
                subject,
                text: body,
                html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172B3A;">
          <h2 style="color: #123B50;">Indian Optician</h2>
          <p style="white-space: pre-line;">${body}</p>
          <hr style="border: none; border-top: 1px solid #DCE5EA; margin-top: 20px;" />
          <small style="color: #607482;">Indian Optician | No 67/1, Main Street, Nintavur - 13, Sri Lanka | Tel: +94 67 225 0123</small>
        </div>`
            });
        }
        const newStatus = sendResult.accepted ? 'DISPATCHED' : 'FAILED';
        const deliveryError = sendResult.error || null;
        await db_js_1.default.query(`UPDATE communications
       SET subject = ?, message_body = ?, status = ?, approved_by_user_id = ?, dispatched_at = NOW(), delivery_error = ?
       WHERE id = ?`, [subject, body, newStatus, userId, deliveryError, communication_id]);
        await (0, security_js_1.logAuditEvent)(userId, 'APPROVE_COMMUNICATION', 'COMMUNICATION', communication_id, {
            recipient: comm.email || comm.recipient_contact,
            status: newStatus
        }, req);
        res.json({
            success: true,
            data: {
                id: communication_id,
                status: newStatus,
                dispatched: sendResult.accepted,
                error: deliveryError,
            }
        });
    }
    catch (err) {
        console.error('approveAndDispatch error:', err);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Failed to approve message' } });
    }
}
