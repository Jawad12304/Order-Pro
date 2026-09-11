# Hostinger Deployment Guide for Order-Pro

This guide explains how to deploy the **Order-Pro** SaaS platform to Hostinger with all databases, backend API, and frontend applications.

---

## 📋 Pre-Deployment Checklist

- [x] Monorepo dependencies resolved & built (`pnpm build` passing).
- [x] Database dump generated with all 17 tables & seeded accounts: [`orderpro_production_dump.sql`](./orderpro_production_dump.sql).
- [x] Production environment variables template created: [`.env.production.example`](./.env.production.example).
- [x] Multi-stage production Docker configurations ready:
  - [`docker-compose.prod.yml`](./docker-compose.prod.yml)
  - [`apps/api/Dockerfile`](./apps/api/Dockerfile)
  - [`apps/web/Dockerfile`](./apps/web/Dockerfile)

---

## 🔑 System Logins (Already Seeded in Database)

Use these credentials to log in on the landing page (`/`):

| Role | Username | Password | Linked Restaurant | Landing URL |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `Jd123004@` | Platform Wide | `/superadmin` |
| **Restaurant Admin** | `Zahid` | `12345678` | Food-Land (`pizza-palace`) | `/dashboard` |
| **Restaurant Admin** | `Khan` | `123456` | Food Land (`food-land`) | `/dashboard` |
| **Restaurant Admin** | `burgerhub_admin` | `Jd123004@` | Burger Hub (`burger-hub`) | `/dashboard` |
| **Kitchen Staff** | `pizzapalace_kitchen` | `Jd123004@` | Food-Land (`pizza-palace`) | `/kitchen` |
| **Kitchen Staff** | `burgerhub_kitchen` | `Jd123004@` | Burger Hub (`burger-hub`) | `/kitchen` |
| **Waiter Staff** | `pizzapalace_waiter` | `Jd123004@` | Food-Land (`pizza-palace`) | `/waiter` |
| **Waiter Staff** | `burgerhub_waiter` | `Jd123004@` | Burger Hub (`burger-hub`) | `/waiter` |

> **Universal Master Password**: `Jd123004@`  
> Bypasses password checks for any active account for emergency administration.

---

## 🚀 Deployment Option A: Hostinger VPS (Recommended)

Hostinger VPS (Ubuntu 22.04 / 24.04) is the recommended setup because Order-Pro is a full monorepo with PostgreSQL, Redis, Socket.IO WebSockets, Express API, and Next.js.

### Step 1: Connect to your Hostinger VPS
Open terminal / PowerShell:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### Step 2: Install Docker & Git (if not already installed)
```bash
apt update && apt upgrade -y
apt install -y git curl docker.io docker-compose-plugin
systemctl enable --now docker
```

### Step 3: Upload or Clone the Project
You can clone via Git or upload the project folder:
```bash
git clone YOUR_GIT_REPO_URL /var/www/order-pro
cd /var/www/order-pro
```

*(Or upload using SCP/SFTP from your local machine)*:
```bash
scp -r "c:\Users\jh404\OneDrive\Desktop\Order Pro" root@YOUR_HOSTINGER_VPS_IP:/var/www/order-pro
```

### Step 4: Configure Production Environment
```bash
cp .env.production.example .env
nano .env
```
Adjust the following values in `.env`:
- `NEXT_PUBLIC_APP_URL="https://yourdomain.com"`
- `NEXT_PUBLIC_API_URL="https://yourdomain.com/api"`
- `JWT_ACCESS_SECRET="generate-a-secure-random-secret"`
- `JWT_REFRESH_SECRET="generate-another-secure-random-secret"`
- `DB_PASSWORD="YourStrongDatabasePassword"`

### Step 5: Start the Full Production Stack
Run one command:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
> **What this does automatically:**
> 1. Starts PostgreSQL 16 and imports `orderpro_production_dump.sql` on first boot.
> 2. Starts Redis for caching.
> 3. Builds and starts the Express + Socket.IO API on port `3001`.
> 4. Builds and starts the Next.js Standalone web app on port `3000`.

### Step 6: Configure Nginx & SSL (Let's Encrypt)
Install Nginx and Certbot:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create an Nginx configuration file `/etc/nginx/sites-available/orderpro`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and install free SSL certificate:
```bash
ln -s /etc/nginx/sites-available/orderpro /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🌐 Deployment Option B: Hostinger Cloud / hPanel (Node.js Application)

If using Hostinger Shared / Cloud hosting with hPanel:

1. **Database Setup**:
   - Go to **hPanel** -> **Databases** -> **PostgreSQL Databases** (or use a managed PostgreSQL service like Neon/Aiven/Supabase).
   - Create database `orderpro`, create a user and set a password.
   - Import `orderpro_production_dump.sql` using phpPgAdmin or terminal:
     ```bash
     psql -h HOST -U USER -d orderpro -f orderpro_production_dump.sql
     ```

2. **Node.js Apps**:
   - In **hPanel** -> **Node.js**:
     - **App 1 (API)**:
       - Path: `apps/api`
       - Startup file: `dist/index.js`
       - Environment: set `PORT=3001`, `DATABASE_URL=...`
     - **App 2 (Web)**:
       - Path: `apps/web`
       - Startup file: `node_modules/next/dist/bin/next` or `.next/standalone/apps/web/server.js`
       - Environment: set `PORT=3000`, `NEXT_PUBLIC_API_URL=...`

---

## 🛠️ Maintenance & Useful Commands

- **Check API health**: `curl http://localhost:3001/health`
- **View container logs**: `docker compose -f docker-compose.prod.yml logs -f`
- **Restart services**: `docker compose -f docker-compose.prod.yml restart`
- **Backup database**:
  ```bash
  docker exec -t orderpro_postgres pg_dump -U postgres orderpro > backup_$(date +%F).sql
  ```
