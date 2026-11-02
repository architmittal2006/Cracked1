# Cracked / Peer-Platform Architecture & Deployment Guide

This repository is organized into three clean, dedicated directories:

- `frontend/`: React 19 + Vite + Tailwind CSS SPA, deployed on **Vercel**.
- `backend/`: Node.js / Express API + Drizzle ORM / pg, deployed on **Render**.
- `docs/`: Product specs, roadmaps, and deployment documentation.

---

## 1. Frontend (`frontend/`) -> Vercel

### Setup on Vercel
1. In Vercel, set the **Root Directory** to `frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.

### Routing & API Proxy
- Configured via `frontend/vercel.json`.
- Requests to `/api/*` are reverse-proxied to your Render backend:
  ```json
  {
    "version": 2,
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "https://<your-render-service>.onrender.com/api/:path*"
      },
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- Keep `VITE_API_URL` unset or empty in production on Vercel so requests use the same-origin proxy, maintaining secure session cookies.

---

## 2. Backend (`backend/`) -> Render

### Setup on Render
1. Create a **Web Service** on Render connected to this repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm run start`

### Environment Variables on Render
Set the following in the Render Dashboard:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled/direct connection string with `?sslmode=require` |
| `SESSION_SECRET` | Secure random 32+ byte string |
| `CLIENT_ORIGIN` | Your Vercel frontend origin (e.g. `https://your-project.vercel.app`) |
| `BASE_URL` | Your Vercel frontend origin (e.g. `https://your-project.vercel.app`) |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `CASE_MODERATOR_EMAILS` | Comma-separated admin/moderator emails |

---

## 3. Database: Neon PostgreSQL

- Use the connection string provided in your Neon Console:
  ```
  DATABASE_URL=postgres://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
  ```
- Session storage (`connect-pg-simple`) and Drizzle ORM automatically connect via standard PostgreSQL pooling.
- The API creates its tables on startup. Do not run `npm run migrate` on Render: that legacy script also seeds demo users and cases.

---

## 4. Media Storage: Cloudinary

- Backend image upload endpoint is configured at:
  - `POST /api/upload/image` (Multipart Form data with file key `image`).
- Images are processed in memory and uploaded directly to Cloudinary under the `caseforge` folder.
- Returned response:
  ```json
  {
    "success": true,
    "url": "https://res.cloudinary.com/.../image/upload/...",
    "publicId": "caseforge/..."
  }
  ```

---

## 5. Local Development

### Run Backend
```bash
cd backend
npm ci
# Copy .env.example to .env and fill in your local Neon and Cloudinary credentials.
npm run dev
```

### Run Frontend
```bash
cd frontend
npm ci
npm run dev
```

### Tests
```bash
cd backend
npm run test:unit
```

Integration tests require a separate `TEST_DATABASE_URL` pointing to a disposable PostgreSQL database. Never point it at production data.
