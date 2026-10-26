# Deployment configuration

The Vercel project serves the client build from `client/dist`. It proxies `/api/*`
to the Render backend, so browser requests and the session cookie use the Vercel
site's origin. Keep `VITE_API_URL` unset or empty in Vercel; setting it to the
Render URL bypasses the proxy. `sameSite: 'lax'` and secure production cookies
work with this same-origin setup.

Set these environment variables:

| Variable | Configure as |
| --- | --- |
| `VITE_API_URL` | Leave unset or empty on Vercel. For local development, use `http://localhost:8080` if the client should call the backend directly. |
| `CLIENT_ORIGIN` | The exact client origin, such as `https://your-project.vercel.app`; use `http://localhost:5174` locally. |
| `SESSION_SECRET` | A unique, random secret of at least 32 bytes. Required in production. |
| `CASE_MODERATOR_EMAILS` | Comma-separated email addresses allowed to moderate case proposals and casebooks. |
| `DATABASE_URL` | The PostgreSQL connection string used by the Render backend. |
| `BASE_URL` | The client origin used for OAuth callback URLs, matching `CLIENT_ORIGIN`. |

Deploy the Express API on Render with its PostgreSQL database. Configure Vercel's
rewrite target in `vercel.json` to the public Render service URL if the backend
hostname changes. Do not point Vercel's client build at the Express process.
