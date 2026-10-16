import { z } from 'zod';

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Customer full name is required').max(100),
  phone_number: z.string().min(7, 'A valid contact phone number is required').max(20),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  age: z.coerce.number().int().min(1).max(120).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  occupation: z.string().max(100).optional().or(z.literal('')),
  preferences_notes: z.string().optional().or(z.literal('')),
});

export const prescriptionSchema = z.object({
  customer_id: z.coerce.number().int().positive('Valid customer ID is required'),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  clinical_notes: z.string().optional().or(z.literal('')),
  od_sph: z.coerce.number().min(-20.0).max(20.0, 'OD SPH must be between -20.00 and +20.00 D'),
  od_cyl: z.coerce.number().min(-10.0).max(10.0, 'OD CYL must be between -10.00 and +10.00 D').default(0),
  od_axis: z.coerce.number().int().min(0).max(180, 'OD AXIS must be between 0 and 180 degrees').default(0),
  od_add: z.coerce.number().min(0.0).max(4.0, 'OD ADD must be between 0.00 and +4.00 D').default(0),
  os_sph: z.coerce.number().min(-20.0).max(20.0, 'OS SPH must be between -20.00 and +20.00 D'),
  os_cyl: z.coerce.number().min(-10.0).max(10.0, 'OS CYL must be between -10.00 and +10.00 D').default(0),
  os_axis: z.coerce.number().int().min(0).max(180, 'OS AXIS must be between 0 and 180 degrees').default(0),
  os_add: z.coerce.number().min(0.0).max(4.0, 'OS ADD must be between 0.00 and +4.00 D').default(0),
  pd: z.coerce.number().min(40.0).max(80.0, 'Pupillary Distance (PD) must be between 40.0 and 80.0 mm'),
});
