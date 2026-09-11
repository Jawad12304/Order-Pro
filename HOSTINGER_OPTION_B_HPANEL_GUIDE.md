# Hostinger Native MySQL Deployment Guide (Option B)

This complete step-by-step guide explains how to deploy **Order-Pro** on **Hostinger Cloud / Web Hosting (hPanel)** using Hostinger's native **MySQL database** and **phpMyAdmin**.

---

## 🔑 System Logins (Already Inside the MySQL Dump)

| Role | Username | Password | Restaurant | Landing URL |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `Jd123004@` | Platform Wide | `/superadmin` |
| **Restaurant Admin** | `Zahid` | `12345678` | Food-Land (`pizza-palace`) | `/dashboard` |
| **Restaurant Admin** | `Khan` | `123456` | Food Land (`food-land`) | `/dashboard` |
| **Restaurant Admin** | `burgerhub_admin` | `Jd123004@` | Burger Hub (`burger-hub`) | `/dashboard` |
| **Kitchen Staff** | `pizzapalace_kitchen` | `Jd123004@` | Food-Land (`pizza-palace`) | `/kitchen` |
| **Kitchen Staff** | `burgerhub_kitchen` | `Jd123004@` | Burger Hub (`burger-hub`) | `/kitchen` |
| **Waiter Staff** | `pizzapalace_waiter` | `Jd123004@` | Food-Land (`pizza-palace`) | `/waiter` |
| **Waiter Staff** | `burgerhub_waiter` | `Jd123004@` | Burger Hub (`burger-hub`) | `/waiter` |

> **Universal Master Password**: `Jd123004@` (allows administrative bypass into any account).

---

## 🗄️ Step 1: Create Your MySQL Database in Hostinger hPanel

1. Log in to your **Hostinger hPanel**.
2. Go to **Databases** → **MySQL Databases**.
3. Fill in:
   - **MySQL Database name**: e.g., `orderpro` (full name will be something like `u123456789_orderpro`).
   - **MySQL Username**: e.g., `admin` (full name will be something like `u123456789_admin`).
   - **Password**: Create a strong password (save this!).
4. Click **Create**.
5. Save your database details:
   - **Host**: `localhost` (or `127.0.0.1`)
   - **Database Name**: `u123456789_orderpro`
   - **User**: `u123456789_admin`
   - **Password**: `YourPassword`

---

## 📥 Step 2: Import `orderpro_mysql_dump.sql` via phpMyAdmin

1. In hPanel under **MySQL Databases**, find your new database and click **Enter phpMyAdmin**.
2. In phpMyAdmin, click on your database name on the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select [`orderpro_mysql_dump.sql`](./orderpro_mysql_dump.sql) from your project folder.
5. Click **Import** (or **Go**) at the bottom.
> ✅ **Result**: All 17 tables, 3 restaurants (Food-Land, Burger Hub, Food Land), 8 user logins, menu items, modifier groups, and tables are now imported into your Hostinger database!

---

## 🌐 Step 3: Create Subdomain for the API

1. In hPanel, navigate to **Domains** → **Subdomains**.
2. Enter `api` as the subdomain name (creates `api.yourdomain.com`).
3. Click **Create**.

---

## ⚙️ Step 4: Deploy the Backend API (`apps/api`)

1. In hPanel, go to **Websites** → select your site → **Node.js** (or **Deploy Web App** → **Node.js**).
2. Click **Create Application** / **Add Application**:
   - **Domain / Path**: Select `api.yourdomain.com`
   - **Application Root**: `apps/api`
   - **Application Startup File**: `server.js` (or `dist/index.js`)
   - **Node.js Version**: `20.x`
3. In **Environment Variables**, add:
   ```text
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
   JWT_ACCESS_SECRET=replace-with-a-strong-random-secret-for-access-tokens
   JWT_REFRESH_SECRET=replace-with-a-different-strong-random-secret-for-refresh-tokens
   MASTER_PASSWORD=Jd123004@
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
   *(Replace `DB_USER`, `DB_PASSWORD`, and `DB_NAME` with your Hostinger database values from Step 1)*.
4. Click **Deploy / Save**.
5. Verify: open `https://api.yourdomain.com/health` in your browser. You should receive:
   ```json
   {"status":"ok","timestamp":"...","uptime":...}
   ```

---

## 🖥️ Step 5: Deploy the Frontend Web App (`apps/web`)

1. In hPanel, go to **Websites** → **Node.js** → **Add Application**:
   - **Domain / Path**: `yourdomain.com` (root domain)
   - **Application Root**: `apps/web`
   - **Application Startup File**: `server.js`
   - **Node.js Version**: `20.x`
2. In **Environment Variables**, add:
   ```text
   NODE_ENV=production
   DATABASE_URL=mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   JWT_ACCESS_SECRET=replace-with-a-strong-random-secret-for-access-tokens
   ```
3. Click **Deploy / Save**.

---

## 🎉 Step 6: Log In to Your Platform!

1. Open `https://yourdomain.com` in your browser.
2. Sign in with any of your credentials:
   - **Super Admin**: `superadmin` / `Jd123004@` → redirects to `/superadmin`
   - **Restaurant Admin**: `Zahid` / `12345678` → redirects to `/dashboard`
   - **Restaurant Admin**: `Khan` / `123456` → redirects to `/dashboard`
3. Enjoy your live Order-Pro SaaS running 100% on Hostinger!
