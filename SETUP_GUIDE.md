# 🧪 Polymath — Complete Setup Guide

Follow these steps **in order** to get Polymath running locally and then deploy it.

---

## STEP 1 — Install Node.js (if not already installed)

Download from: https://nodejs.org (choose the LTS version)
Verify by running in terminal: `node --version` (should show v18+)

---

## STEP 2 — Set up Supabase (all in your browser, no download)

### 2a. Create a project
1. Go to https://supabase.com → Sign up free
2. Click **"New Project"**
3. Name it `polymath`, choose a region close to you, set a DB password, click Create
4. Wait ~2 minutes for it to provision

### 2b. Run the database schema
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `database/schema.sql` from this folder
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** — you should see "Success"

### 2c. Enable Google Auth
1. In Supabase dashboard → **Authentication** → **Providers**
2. Click **Google** → Toggle it on
3. Go to https://console.cloud.google.com → Create a project
4. APIs & Services → Credentials → Create OAuth 2.0 Client
5. Add `https://your-project-id.supabase.co/auth/v1/callback` as an authorized redirect URI
6. Copy the Client ID and Secret back into Supabase

### 2d. Enable Apple Auth (optional)
1. In Supabase → Authentication → Providers → Apple
2. Follow the instructions there (requires an Apple Developer account)

### 2e. Copy your API keys
In your Supabase project → **Settings** → **API**:
- Copy `Project URL` → you'll need this
- Copy `anon/public` key → you'll need this
- Copy `service_role` key → you'll need this (keep this SECRET)

---

## STEP 3 — Set up environment variables

### Frontend:
1. In the `frontend/` folder, copy `.env.example` → rename it to `.env`
2. Fill in your values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend:
1. In the `backend/` folder, copy `.env.example` → rename it to `.env`
2. Fill in your values:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Email setup (for weekly digest & daily reminders):
For Gmail:
1. Go to your Google Account → Security → App Passwords
2. Generate an app password for "Mail"
3. Add to backend `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
```

For a free alternative, use https://resend.com (100 emails/day free):
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
```

---

## STEP 4 — Install dependencies & run locally

Open a terminal, navigate to the `polymath` folder, then:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### Run the frontend:
```bash
cd frontend
npm run dev
```
Open http://localhost:3000 in your browser

### Run the backend (in a second terminal):
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

---

## STEP 5 — Deploy to Vercel (frontend)

1. Push your project to GitHub (create a repo, push the code)
2. Go to https://vercel.com → Import your GitHub repo
3. Set the **Root Directory** to `frontend`
4. Add Environment Variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click Deploy — done! 🎉

### Update Supabase for production:
In Supabase → Authentication → URL Configuration:
- Site URL: `https://your-vercel-app.vercel.app`
- Redirect URLs: add `https://your-vercel-app.vercel.app/**`

---

## STEP 6 — Deploy backend (optional for email features)

You can deploy the backend on **Railway** (free tier):
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo, set the root to `backend`
3. Add all backend `.env` variables in Railway dashboard
4. It auto-deploys on push

Or on **Render** (free tier):
1. Go to https://render.com → New Web Service
2. Connect GitHub repo, set root to `backend`, build command: `npm install`, start: `npm start`

---

## Project Structure

```
polymath/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── pages/             # All pages
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # Supabase, store, data
│   │   └── styles/            # Global CSS
│   ├── .env                   # ← You create this
│   └── package.json
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── lib/               # Supabase admin, mailer, cron
│   │   └── routes/            # API routes
│   ├── .env                   # ← You create this
│   └── package.json
├── database/
│   └── schema.sql             # ← Run this in Supabase
└── SETUP_GUIDE.md             # This file
```

---

## Troubleshooting

**"Missing Supabase environment variables"**
→ Make sure your `.env` file exists in `frontend/` and has the correct values (no spaces around `=`)

**Google login not working**
→ Make sure your Supabase project URL is added as a redirect URI in Google Console

**Emails not sending**
→ For Gmail, you must use an App Password (not your regular password). Enable 2FA first.

**Streak not updating**
→ The streak logic is client-side in Zustand + synced to Supabase after each session

---

## Support
If you run into issues, check Supabase docs: https://supabase.com/docs

---

## NEW: Spaced Repetition System

The SM-2 algorithm is now built in. Here's how it works:

- After each card, users pick: ❌ Forgot / 😅 Hard / ✅ Got It / ⭐ Easy
- The algorithm schedules the next review based on their answer
- Cards start with 1-day intervals and grow to weeks/months as you learn them
- The Domain page now shows: **Due**, **New**, and **Learned** card counts
- Dashboard shows total due cards across all domains

**Database:** A new `sr_records` table stores each user's review history per card.
Make sure to run the updated `database/schema.sql` (it appends the new table at the bottom).

---

## NEW: Admin Dashboard

Access at: `http://localhost:3000/admin/login`  
(In production: `https://your-app.vercel.app/admin/login`)

### Set your admin password:
In `frontend/.env`, add:
```
VITE_ADMIN_PASSWORD=your-secure-password-here
```

### Admin features:
- **Overview** — Total users, active today, total cards, weekly XP
- **Knowledge Cards** — Add, edit, delete cards with live preview. Filter by domain/difficulty/search. Export as JS file to replace `knowledge.js`
- **Users** — Browse all users, sort by XP/streak, expand any user to see their domains and recent activity
- **Stats** — Daily active users chart (14-day), domain popularity, spaced repetition health metrics

### Adding cards via Admin:
1. Go to `/admin` → Knowledge Cards → New Card
2. Fill in domain, topic, title, content, fun fact, XP, difficulty
3. Preview renders live as you type
4. Click Add Card
5. When done, click **Export JS** — it downloads a `knowledge_cards.js` file
6. Replace `frontend/src/lib/knowledge.js` KNOWLEDGE_CARDS export with the exported content
7. Redeploy to Vercel

> Note: In this version, card edits are local (in-memory). The export → replace flow persists them. A future version can store cards in Supabase directly.
