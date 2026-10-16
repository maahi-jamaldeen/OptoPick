-- OptoPick Development Seed Data
-- Client: Indian Optician, Main Street, Nintavur, Sri Lanka

USE `optopick_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. System Settings
TRUNCATE TABLE `system_settings`;
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('clinic_name', 'Indian Optician', 'Official practice business name'),
('clinic_address', 'No 67/1, Main Street, Nintavur - 13, Eastern Province, Sri Lanka', 'Registered address'),
('clinic_phone', '+94 67 225 0123', 'Customer service hotline'),
('clinic_email', 'contact@indianoptician.lk', 'Official email address'),
('currency_code', 'LKR', 'Base operating currency (Sri Lankan Rupees)'),
('recall_period_months', '12', 'Standard routine eye examination recall period'),
('lapsed_period_months', '24', 'Threshold period in months to classify patient as lapsed');

-- 2. Users (Administrator / Optometrist and Optical Staff)
-- Note: password hashes will be updated by backend bootstrap or migration with argon2id.
-- Placeholder hash provided for development; backend auth service initializes or verifies credentials.
TRUNCATE TABLE `users`;
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `is_active`) VALUES
(1, 'optometrist', 'musthaq@indianoptician.lk', '$argon2id$v=19$m=65536,t=3,p=4$qF7W1D2J3K4L5M6N7O8P9Q$z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3h2g1f0e9d8c7b6a5', 'Mr. Musthaq (Eye Consultant)', 'ADMIN', 1),
(2, 'staff', 'staff@indianoptician.lk', '$argon2id$v=19$m=65536,t=3,p=4$qF7W1D2J3K4L5M6N7O8P9Q$z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3h2g1f0e9d8c7b6a5', 'Fathima Nusra (Dispensing Staff)', 'STAFF', 1);

-- 3. Suppliers
TRUNCATE TABLE `suppliers`;
INSERT INTO `suppliers` (`id`, `supplier_code`, `name`, `contact_person`, `phone`, `email`, `address`, `is_active`) VALUES
(1, 'SUP-001', 'Lanka Optical Supplies (Pvt) Ltd', 'Mr. Perera', '+94 11 234 5678', 'orders@lankaoptical.lk', 'No. 45, Galle Road, Colombo 03', 1),
(2, 'SUP-002', 'VisionCraft Labs International', 'Mr. Ahamed', '+94 81 223 4455', 'sales@visioncraft.lk', 'No. 12, Kandy Road, Kandy', 1),
(3, 'SUP-003', 'Eastern Precision Optical', 'Mr. Thivakaran', '+94 65 222 3344', 'contact@easternoptical.lk', 'No. 88, Central Road, Batticaloa', 1);

-- 4. Frames Catalog
TRUNCATE TABLE `frames`;
INSERT INTO `frames` (`id`, `frame_code`, `brand`, `model_name`, `shape`, `color`, `material`, `size`, `selling_price`, `supplier_id`, `stock_quantity`, `low_stock_threshold`, `is_active`) VALUES
(1, 'FRM-RB-5154', 'Ray-Ban', 'Clubmaster Classic', 'Square', 'Black / Gold', 'Acetate & Metal', '51-21-145', 18500.00, 1, 4, 2, 1),
(2, 'FRM-SIL-2901', 'Silhouette', 'Urban LITE', 'Rectangular', 'Matte Navy Blue', 'High-Tech Titanium', '52-17-140', 24500.00, 1, 2, 2, 1),
(3, 'FRM-VO-5276', 'Vogue', 'In Vogue Optical', 'Cat-Eye', 'Dark Havana Tortoise', 'Acetate', '53-16-140', 12500.00, 2, 5, 2, 1),
(4, 'FRM-TIT-102', 'Titan Eye+', 'Flex Pro TR90', 'Rectangular', 'Matte Black', 'TR90 Swiss Grilamid', '54-18-142', 7500.00, 2, 8, 3, 1),
(5, 'FRM-FST-801', 'Fastrack', 'Urban Sport', 'Aviator', 'Gunmetal Grey', 'Stainless Steel', '55-17-140', 5800.00, 3, 6, 3, 1),
(6, 'FRM-SAF-204', 'Safilo', 'Heritage Round', 'Round', 'Antique Gold', 'Monel Metal', '49-20-140', 9200.00, 3, 1, 2, 1),
(7, 'FRM-POL-703', 'Polaroid', 'Contemporary Oval', 'Oval', 'Burgundy Wine', 'Polycarbonate', '51-17-138', 8400.00, 2, 0, 2, 1);

-- 5. Lenses Catalog (Configured with precise Rx compatibility boundaries for LensIQ)
TRUNCATE TABLE `lenses`;
INSERT INTO `lenses` (`id`, `lens_code`, `brand`, `design_type`, `material`, `refractive_index`, `coatings`, `min_sph`, `max_sph`, `min_cyl`, `max_cyl`, `min_add`, `max_add`, `selling_price`, `supplier_id`, `stock_quantity`, `low_stock_threshold`, `is_available`) VALUES
(1, 'LNS-CR39-HC', 'OptoStandard', 'SINGLE_VISION', 'CR-39 Standard Plastic', 1.50, 'Hard Coat (Anti-Scratch)', -6.00, 6.00, -2.00, 2.00, NULL, NULL, 3500.00, 3, 20, 5, 1),
(2, 'LNS-CRIZ-ALZ', 'Essilor', 'SINGLE_VISION', 'CR-39 Standard Plastic', 1.50, 'Crizal Alize UV (Anti-Reflective)', -6.00, 6.00, -2.50, 2.50, NULL, NULL, 5800.00, 1, 12, 3, 1),
(3, 'LNS-HI156-BLU', 'VisionCraft', 'SINGLE_VISION', 'Hi-Index Plastic', 1.56, 'Blue Cut Filter + AR Coat', -8.00, 6.00, -3.00, 3.00, NULL, NULL, 7500.00, 2, 10, 3, 1),
(4, 'LNS-HOYA-160', 'Hoya', 'SINGLE_VISION', 'MR-8 Hi-Index Aspheric', 1.60, 'Super Hi-Vision Clean Coat', -10.00, 6.00, -4.00, 4.00, NULL, NULL, 12500.00, 1, 6, 2, 1),
(5, 'LNS-SEIK-167', 'Seiko', 'SINGLE_VISION', 'MR-7 Ultra Hi-Index', 1.67, 'Super Clean Multi-Coat', -14.00, 8.00, -4.00, 4.00, NULL, NULL, 19000.00, 1, 4, 2, 1),
(6, 'LNS-TRANS-156', 'Transitions', 'SINGLE_VISION', 'Photochromic Plastic', 1.56, 'Transitions Gen8 Grey + AR', -6.00, 4.00, -2.50, 2.50, NULL, NULL, 14500.00, 1, 5, 2, 1),
(7, 'LNS-FLAT-FT28', 'OptoStandard', 'BIFOCAL', 'CR-39 Standard Plastic', 1.50, 'Hard Coat', -6.00, 6.00, -2.00, 2.00, 1.00, 3.50, 6500.00, 3, 8, 2, 1),
(8, 'LNS-VARI-COMF', 'Varilux', 'PROGRESSIVE', 'Hi-Index Plastic', 1.56, 'Crizal Easy Pro AR', -8.00, 6.00, -3.00, 3.00, 1.00, 3.50, 23000.00, 1, 4, 2, 1),
(9, 'LNS-KODK-PROG', 'Kodak', 'PROGRESSIVE', 'Standard Plastic', 1.50, 'Clean&CleAR Anti-Reflective', -6.00, 5.00, -2.50, 2.50, 1.00, 3.00, 16000.00, 2, 3, 2, 1);

-- 6. Accessories Catalog
TRUNCATE TABLE `accessories`;
INSERT INTO `accessories` (`id`, `item_code`, `name`, `selling_price`, `supplier_id`, `stock_quantity`, `low_stock_threshold`, `is_active`) VALUES
(1, 'ACC-SPRAY-50', 'Anti-Fog & Lens Cleaning Spray 50ml', 850.00, 3, 25, 5, 1),
(2, 'ACC-CLOTH-MF', 'Microfiber Premium Cleaning Cloth (Pack of 2)', 350.00, 3, 40, 10, 1),
(3, 'ACC-CASE-HD', 'Hard-Shell Magnetic Eyewear Case', 1200.00, 2, 15, 5, 1),
(4, 'ACC-STRAP-SL', 'Sports Silicone Non-Slip Cord', 600.00, 2, 18, 5, 1);

-- 7. Customers
TRUNCATE TABLE `customers`;
INSERT INTO `customers` (`id`, `customer_code`, `full_name`, `phone_number`, `email`, `address`, `age`, `gender`, `occupation`, `preferences_notes`) VALUES
(1, 'CUST-2025-0101', 'Mohamed Rizwan', '0771234567', 'rizwan.m@gmail.com', 'No. 14, Beach Road, Nintavur - 04', 38, 'MALE', 'Senior Software Engineer', 'Spends 9+ hours daily on screens; complains of evening glare and digital eye fatigue.'),
(2, 'CUST-2025-0102', 'Sithy Rahila', '0779876543', 'rahila.sithy@yahoo.com', 'Main Street, Addalaichenai', 54, 'FEMALE', 'School Principal', 'Prefers lightweight frames; needs reading addition for document reviews.'),
(3, 'CUST-2026-0001', 'Kavinda Jayasuriya', '0714567890', 'kavinda.j@outlook.com', 'Hospital Junction, Sammanthurai', 29, 'MALE', 'Civil Engineer & Site Supervisor', 'Frequently outdoors under intense tropical sun; desires photochromic transitions.'),
(4, 'CUST-2024-0042', 'Abdul Raheem', '0753344556', 'raheem.tr@gmail.com', 'Post Office Road, Nintavur - 02', 62, 'MALE', 'Retired Bank Manager', 'Long-time customer; requires progressive spectacles with wide reading corridor.'),
(5, 'CUST-2024-0015', 'Nisthar Mohamed', '0765544332', NULL, 'Kalliyankadu, Akkaraipattu', 45, 'MALE', 'Agricultural Merchant', 'Lapsed customer, has not visited the optical center in over 24 months.');

-- 8. Eye Examinations & Prescriptions
TRUNCATE TABLE `examinations`;
INSERT INTO `examinations` (`id`, `customer_id`, `examiner_id`, `exam_date`, `clinical_notes`) VALUES
(1, 1, 1, '2025-04-10', 'Routine refraction check. Mild astigmatism present. Good visual acuity with correction.'),
(2, 1, 1, '2026-04-12', 'Annual review. Slight increase in myopic sphere in right eye (-0.25 D). Advised blue light filter.'),
(3, 2, 1, '2025-08-20', 'Presbyopia onset. Reading addition +2.00 D recommended. Retinoscopy clear.'),
(4, 3, 1, '2026-03-15', 'Complains of distance blur during highway driving. Mild cylinder in both eyes.'),
(5, 4, 1, '2024-09-05', 'High presbyopia. Prescribed progressive lenses with +2.50 D ADD.');

TRUNCATE TABLE `prescriptions`;
INSERT INTO `prescriptions` (`id`, `examination_id`, `customer_id`, `od_sph`, `od_cyl`, `od_axis`, `od_add`, `os_sph`, `os_cyl`, `os_axis`, `os_add`, `pd`, `is_latest`) VALUES
(1, 1, 1, -2.00, -0.75, 90, 0.00, -1.75, -0.50, 85, 0.00, 63.0, 0),
(2, 2, 1, -2.25, -0.75, 90, 0.00, -1.75, -0.50, 85, 0.00, 63.5, 1),
(3, 3, 2, 0.50, -0.50, 180, 2.00, 0.75, -0.50, 175, 2.00, 61.0, 1),
(4, 4, 3, -1.50, -1.00, 75, 0.00, -1.25, -0.75, 80, 0.00, 65.0, 1),
(5, 5, 4, 1.25, -0.75, 100, 2.50, 1.50, -0.50, 95, 2.50, 64.0, 1);

-- 9. Sales, Sale Items, Payments & Inventory Movements
TRUNCATE TABLE `sales`;
INSERT INTO `sales` (`id`, `sale_number`, `customer_id`, `prescription_id`, `user_id`, `subtotal`, `discount_amount`, `total_amount`, `paid_amount`, `balance_amount`, `payment_status`, `order_status`, `order_type`, `notes`, `created_at`) VALUES
(1, 'INV-2026-0001', 1, 2, 2, 26000.00, 1000.00, 25000.00, 15000.00, 10000.00, 'PARTIALLY_PAID', 'DISPATCHED_TO_LAB', 'CUSTOM_FITTING_ORDER', 'Dispatched to Eastern Eye Labs for Crizal glazing. Advance of LKR 15,000 paid.', '2026-04-12 11:30:00'),
(2, 'INV-2026-0002', 3, 4, 2, 20300.00, 300.00, 20000.00, 20000.00, 0.00, 'PAID', 'RECEIVED_FROM_LAB', 'CUSTOM_FITTING_ORDER', 'Glazed spectacles received from lab. Ready for customer collection.', '2026-04-10 16:45:00');

TRUNCATE TABLE `sale_items`;
INSERT INTO `sale_items` (`id`, `sale_id`, `item_type`, `product_id`, `unit_price`, `quantity`, `total_price`) VALUES
(1, 1, 'FRAME', 1, 18500.00, 1, 18500.00),
(2, 1, 'LENS', 3, 7500.00, 1, 7500.00),
(3, 2, 'FRAME', 5, 5800.00, 1, 5800.00),
(4, 2, 'LENS', 6, 14500.00, 1, 14500.00);

TRUNCATE TABLE `payments`;
INSERT INTO `payments` (`id`, `payment_number`, `sale_id`, `amount`, `payment_method`, `payment_type`, `user_id`, `created_at`) VALUES
(1, 'PAY-2026-0001', 1, 15000.00, 'CARD', 'ADVANCE', 2, '2026-04-12 11:35:00'),
(2, 'PAY-2026-0002', 2, 20000.00, 'CASH', 'FULL', 2, '2026-04-10 16:50:00');

TRUNCATE TABLE `inventory_movements`;
INSERT INTO `inventory_movements` (`id`, `product_type`, `product_id`, `movement_type`, `quantity_change`, `previous_quantity`, `new_quantity`, `reference_sale_id`, `user_id`, `notes`, `created_at`) VALUES
(1, 'FRAME', 1, 'STOCK_IN', 5, 0, 5, NULL, 1, 'Initial batch receipt from Lanka Optical Supplies', '2026-04-01 09:00:00'),
(2, 'FRAME', 1, 'SALE_DEDUCTION', -1, 5, 4, 1, 2, 'Reserved for Sale INV-2026-0001', '2026-04-12 11:30:00'),
(3, 'LENS', 3, 'SALE_DEDUCTION', -1, 11, 10, 1, 2, 'Reserved for Sale INV-2026-0001', '2026-04-12 11:30:00'),
(4, 'FRAME', 5, 'SALE_DEDUCTION', -1, 7, 6, 2, 2, 'Sold for Sale INV-2026-0002', '2026-04-10 16:45:00'),
(5, 'LENS', 6, 'SALE_DEDUCTION', -1, 6, 5, 2, 2, 'Sold for Sale INV-2026-0002', '2026-04-10 16:45:00');

-- 10. Sample Customer Communications
TRUNCATE TABLE `communications`;
INSERT INTO `communications` (`id`, `customer_id`, `related_sale_id`, `comm_type`, `channel`, `recipient_contact`, `subject`, `message_body`, `status`, `approved_by_user_id`, `dispatched_at`) VALUES
(1, 3, 2, 'ORDER_READY', 'EMAIL', 'kavinda.j@outlook.com', 'Your Custom Eyewear is Ready for Collection — Indian Optician', 'Dear Mr. Kavinda,\n\nWe are pleased to inform you that your prescription eyewear order (INV-2026-0002) has been carefully crafted and inspected. Your spectacles are ready for collection at Indian Optician, Main Street, Nintavur.\n\nPlease visit our center at your convenience for professional fitting adjustments.\n\nWarm regards,\nIndian Optician, Nintavur\nHotline: +94 67 225 0123', 'APPROVED', 2, '2026-04-11 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
