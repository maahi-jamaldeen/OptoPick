"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionSchema = exports.customerSchema = void 0;
const zod_1 = require("zod");
exports.customerSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2, 'Customer full name is required').max(100),
    phone_number: zod_1.z.string().min(7, 'A valid contact phone number is required').max(20),
    email: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional().or(zod_1.z.literal('')),
    age: zod_1.z.coerce.number().int().min(1).max(120).optional().nullable(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    occupation: zod_1.z.string().max(100).optional().or(zod_1.z.literal('')),
    preferences_notes: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
exports.prescriptionSchema = zod_1.z.object({
    customer_id: zod_1.z.coerce.number().int().positive('Valid customer ID is required'),
    exam_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    clinical_notes: zod_1.z.string().optional().or(zod_1.z.literal('')),
    od_sph: zod_1.z.coerce.number().min(-20.0).max(20.0, 'OD SPH must be between -20.00 and +20.00 D'),
    od_cyl: zod_1.z.coerce.number().min(-10.0).max(10.0, 'OD CYL must be between -10.00 and +10.00 D').default(0),
    od_axis: zod_1.z.coerce.number().int().min(0).max(180, 'OD AXIS must be between 0 and 180 degrees').default(0),
    od_add: zod_1.z.coerce.number().min(0.0).max(4.0, 'OD ADD must be between 0.00 and +4.00 D').default(0),
    os_sph: zod_1.z.coerce.number().min(-20.0).max(20.0, 'OS SPH must be between -20.00 and +20.00 D'),
    os_cyl: zod_1.z.coerce.number().min(-10.0).max(10.0, 'OS CYL must be between -10.00 and +10.00 D').default(0),
    os_axis: zod_1.z.coerce.number().int().min(0).max(180, 'OS AXIS must be between 0 and 180 degrees').default(0),
    os_add: zod_1.z.coerce.number().min(0.0).max(4.0, 'OS ADD must be between 0.00 and +4.00 D').default(0),
    pd: zod_1.z.coerce.number().min(40.0).max(80.0, 'Pupillary Distance (PD) must be between 40.0 and 80.0 mm'),
});
