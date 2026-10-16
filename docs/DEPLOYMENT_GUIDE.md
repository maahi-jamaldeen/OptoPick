# OptoPick — Production Deployment & Operations Guide

## 1. System Requirements & Hardware Prerequisites

### 1.1 Minimum Hardware Specifications (On-Premise Server / Optical Center Workstation)
- **Processor:** Intel Core i3 / AMD Ryzen 3 or higher.
- **RAM:** Minimum 8 GB (16 GB recommended for concurrent database and web serving).
- **Storage:** 20 GB free SSD storage (for MySQL relational database, audit logs, and application builds).
- **Network:** Stable broadband connection (required for Google Gemini API and Nodemailer SMTP communications).

### 1.2 Software Prerequisites
- **Operating System:** Windows 10/11 Professional, Windows Server, or Ubuntu 22.04+ LTS.
- **Node.js:** v20.x or v22.x LTS.
- **Database Engine:** MySQL 8.0+ or MariaDB 10.4+ (fully compatible with standard XAMPP / WampServer installations).
- **Web Server / Reverse Proxy (Production):** Nginx or Apache.

---

## 2. Step-by-Step Installation & Setup

### Step 2.1 Database Provisioning (MySQL / phpMyAdmin)
1. Start your MySQL service (e.g. through XAMPP Control Panel or Windows Services).
2. Create the target database:
   ```sql
   CREATE DATABASE optopick_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the schema and initial seed data:
   ```bash
   mysql -u root -p optopick_db < database/schema.sql
   mysql -u root -p optopick_db < database/seeds/dev_seed.sql
   ```
   *(Alternatively, in phpMyAdmin, open `optopick_db`, navigate to the **Import** tab, and upload `schema.sql` followed by `dev_seed.sql`)*.

### Step 2.2 Backend Configuration & Build
1. Open terminal and enter backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Create or verify the production environment file (`backend/.env`):
   ```env
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=http://localhost:3000

   # MySQL Connection Pool
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=optopick_db

   # Security & Session
   COOKIE_SECRET=optopick_super_secret_signing_key_at_least_32_chars_long
   SESSION_MAX_AGE_MS=86400000

   # External AI Services (Optional - Falls back gracefully if omitted)
   GEMINI_API_KEY=your_gemini_api_key_here

   # SMTP Notification Credentials
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=notifications@indianoptician.lk
   SMTP_PASS=your_app_specific_password
   ```
3. Build the TypeScript production bundle:
   ```bash
   npm run build
   ```
   *(Compiles typed source files to optimized JavaScript in `backend/dist/`)*.

### Step 2.3 Frontend Production Build
1. Enter frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```
2. Build the production single-page application bundle:
   ```bash
   npm run build
   ```
   *(Generates optimized static HTML, CSS, and JS bundles in `frontend/dist/`)*.

---

## 3. Production Process Management (PM2)

To keep the application running persistently in the background and automatically restart upon reboot:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Start the Backend API service:
   ```bash
   cd backend
   pm2 start dist/server.js --name "optopick-api"
   ```
3. Start the Frontend static file server (or serve via Nginx):
   ```bash
   cd ../frontend
   pm2 serve dist 3000 --spa --name "optopick-ui"
   ```
4. Save the process configuration to persist through server reboots:
   ```bash
   pm2 save
   ```

---

## 4. Production Web Server & Reverse Proxy (Nginx Configuration)

For production deployment using a single standard port (`80` / `443` HTTPS):

```nginx
server {
    listen 80;
    server_name optical.indianoptician.lk;

    # Frontend Single Page Application
    location / {
        root /var/www/optopick/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend Express API Proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Backup & Disaster Recovery Procedures

To safeguard patient refraction records and billing history:

### 5.1 Automated Daily MySQL Dump
Create a scheduled task (Windows Task Scheduler or Linux Cron) executing:
```bash
mysqldump -u root -p optopick_db > "C:\Backups\OptoPick_DB_%date:~10,4%%date:~4,2%%date:~7,2%.sql"
```

### 5.2 Offsite Backup
Synchronize the backup folder with encrypted cloud storage or an external USB hard drive daily at optical center closing time.

---

## 6. System Verification & Health Check

After launching, verify that the health endpoint returns `HTTP 200`:
```bash
curl http://localhost:5000/api/health
```
Expected output:
```json
{
  "status": "UP",
  "service": "OptoPick Intelligent Optical Center Management System",
  "client": "Indian Optician, Nintavur, Sri Lanka",
  "timestamp": "2026-10-14T03:00:00.000Z"
}
```
