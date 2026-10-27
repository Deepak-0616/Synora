# SYNORA: Production Deployment Checklist & Guide

## 1. Prerequisites
- Node.js (v20+ LTS or v22/v24)
- npm (v10+)
- PostgreSQL (v15+) or Supabase Project instance
- Reverse proxy (Nginx or Cloudflare) with HTTPS/TLS configured

---

## 2. Environment Variables Checklist
Ensure the following variables are configured in production:

| Variable | Target Service | Purpose | Production Recommendation |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | API | Environment mode | `production` |
| `PORT` | API | Port to bind | `4000` (or behind container port mapping) |
| `DATABASE_MODE` | API | Database driver | `postgres` (or `sqlite` for lightweight node) |
| `DATABASE_URL` | API | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | API | Secret key for JWT signatures | 64+ char random cryptographically secure string |
| `JWT_EXPIRES_IN` | API | Token lifetime | `7d` |
| `CORS_ALLOWED_ORIGINS` | API | Whitelisted web origins | `https://synora.yourdomain.gov.in` |
| `VITE_API_URL` | Web | REST API endpoint | `https://synora-api.yourdomain.gov.in/api/v1` |

---

## 3. Database Migration & Seeding
1. Apply the version-controlled SQL migration located at `supabase/migrations/20261027000001_initial_schema.sql` via Supabase Dashboard SQL Editor or `psql`:
   ```bash
   psql -d $DATABASE_URL -f supabase/migrations/20261027000001_initial_schema.sql
   ```
2. For staging/demo environments, run the seed script:
   ```bash
   npm --workspace=apps/api run seed
   ```

---

## 4. Building Production Bundles
```bash
# Build backend
npm --workspace=apps/api run build

# Build frontend
npm --workspace=apps/web run build
```

The compiled frontend static files will be generated in `apps/web/dist/`.

---

## 5. Docker Deployment
A complete `docker-compose.yml` is provided at root:
```bash
docker compose up -d --build
```
This deploys:
- PostgreSQL 16 container with automatic migration initialization
- Express REST API container running on port 4000
- Nginx / Web container serving the frontend bundle

---

## 6. Security Hardening Checklist
- [x] Passwords hashed using bcrypt with salt factor 10.
- [x] JWT tokens signed and verified on every protected route.
- [x] Strict role-based scoping: complainants cannot view other cases or internal notes.
- [x] Rate limiting active on authentication and submission endpoints.
- [x] File uploads sanitized with extension allowlist and 10MB limit.
- [x] CSV export protected against spreadsheet formula injection.
- [x] Row Level Security (RLS) policies provided in SQL migration.
