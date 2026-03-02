# Tasha Tongpreecha Casting Database

A full-stack web application for managing casting projects, model profiles, and client presentations.

## Features

- **Model Sign-In** — Models check in to projects via name search, update profile info
- **Admin Panel** — Manage projects, models, media, presentations, clients, and team
- **Client Portal** — View presentations, shortlist models, add notes, download PDFs
- **Media Management** — Upload photos/videos, control visibility, mark for PDF export
- **Presentations** — Curate model selections with customizable visibility settings
- **Instagram Integration** — Auto-fetch follower counts, live hyperlinks
- **PDF Export** — Condensed summary sheets with sizing, photos, and links

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **UI Components:** Custom minimal components
- **API:** React dropzone, DND Kit (drag-drop)

---

## Setup Instructions

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Sign up"** with your email
3. Verify your email
4. Create a new project:
   - Name: "casting-db"
   - Region: Choose closest to you (e.g., us-east-1)
   - Password: Save it somewhere secure
5. Wait for project to initialize (~2 min)

### 2. Set Up Database

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste into the SQL editor
5. Click **"Run"**
6. Tables are now created

### 3. Create Storage Bucket

1. In Supabase, go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Name: `model-media`
4. Toggle **"Public bucket"** ON
5. Click **"Create bucket"**

### 4. Get API Keys

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - `Project URL` → save as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → save as `SUPABASE_SERVICE_ROLE_KEY` (keep private!)

### 5. (Optional) Instagram Follower API

1. Go to [piloterr.com](https://piloterr.com) and sign up
2. Get your free API key from the dashboard
3. Save as `PILOTERR_API_KEY`
   - _Note: If you skip this, Instagram handles still show as links, just no follower count_

### 6. Set Up Environment Variables

1. In this project folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in the values you collected:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxx...
   PILOTERR_API_KEY=your_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 7. Install Dependencies

```bash
npm install
```

### 8. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) in your browser.

### 9. Create Your First Admin User

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"**
3. Email: Your admin email
4. Password: A strong password
5. Toggle **"Auto confirm user"** ON
6. Click **"Create user"**

Now you can log in at `/admin/login`.

---

## Deploying to Vercel

### 1. Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** with GitHub/GitLab/Bitbucket or email
3. Follow the flow to create your account

### 2. Push Code to GitHub

1. Create a new repository on [github.com](https://github.com)
   - Name: `casting-db` (or whatever you like)
   - Public or Private (your choice)

2. In this project folder:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/casting-db.git
   git branch -M main
   git push -u origin main
   ```

### 3. Deploy on Vercel

1. In Vercel, click **"New Project"** or **"Add New"**
2. Select **"Import Git Repository"**
3. Connect GitHub and select your `casting-db` repo
4. Click **"Import"**
5. Under "Environment Variables", add all your `.env.local` values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PILOTERR_API_KEY`
   - `NEXT_PUBLIC_APP_URL` = your deployed URL (e.g., `https://casting-db.vercel.app`)
6. Click **"Deploy"**

Vercel will build and deploy your app in ~3 minutes. You'll get a URL like `casting-db.vercel.app`.

### 4. Connect Your Domain

1. If you want to use a subdomain like `cast.tashatongpreecha.com`:
   - Go to your domain registrar (where you bought tashatongpreecha.com)
   - Add a CNAME record: `cast` → `cname.vercel-dns.com`
   - Or use Vercel's domain management (easier)

2. In Vercel → Project Settings → Domains:
   - Add your domain
   - Follow the DNS setup instructions

---

## First Time Using the App

### For You (Admin)

1. Log in to `/admin/login` with your admin email
2. Create a project: Dashboard → "New Project"
3. Go to your project, click the "Cast Link" to get the sign-in URL
4. Share that URL with models

### For Models

1. They visit `/cast/[project-slug]`
2. Enter their name (with autocomplete)
3. Fill in their profile (sizing, agency, ethnicity, Instagram, etc.)
4. They're checked in!

### For Clients

1. You invite them from **Admin → Clients**
2. You assign them to projects
3. They log in to `/client` and view presentations you publish
4. They can shortlist models and download PDFs

---

## File Structure

```
casting-db/
├── app/
│   ├── cast/[slug]/              # Public model sign-in
│   ├── admin/                    # Admin panel
│   │   ├── login/
│   │   ├── projects/
│   │   ├── models/
│   │   ├── presentations/
│   │   ├── clients/
│   │   └── team/
│   ├── client/                   # Client portal
│   │   ├── login/
│   │   └── presentations/[id]/
│   └── api/                      # Server routes
│       ├── instagram/[handle]/
│       ├── pdf/[id]/
│       ├── invite-client/
│       └── invite-team/
├── components/                   # Reusable UI
│   ├── ui/                       # Buttons, inputs, etc.
│   ├── ChipInput.tsx
│   ├── MediaUploader.tsx
│   ├── ModelCard.tsx
│   └── SortableModelList.tsx
├── lib/supabase/                 # Supabase clients
├── supabase/schema.sql           # Database schema
└── README.md
```

---

## Troubleshooting

**Models can't find themselves by name**
- Make sure they've signed in before (that creates the record)
- Search is case-insensitive, try different spellings

**Media not uploading**
- Check that Supabase storage bucket is public
- Check file size (max ~20MB recommended)

**Can't log in**
- Verify user was created in Supabase → Auth → Users
- Double-check email/password
- Try "forgot password" in Supabase dashboard

**Instagram followers not showing**
- First deployment or cache expired → will show on next refresh
- If PILOTERR_API_KEY is missing, just shows @handle as link
- That's fine—still works!

**PDF downloads blank**
- Ensure at least one photo is marked as PDF primary or secondary in model media
- Photos must be marked as visible

---

## Notes for Tasha

- **RLS Policies:** Row-level security is configured in schema.sql. Team members see everything; clients see only their projects.
- **Instagram API:** Using Piloterr (free tier is generous). If you hit rate limits, can switch to different provider or remove altogether.
- **Email Invites:** Currently uses Supabase's built-in password flow. To add magic links, configure Supabase email templates (free tier limited).
- **Drag-drop:** All drag-drop features are powered by @dnd-kit, works great on touch devices too.

---

## Support

Questions? Refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

Good luck with your casting! 🎬
