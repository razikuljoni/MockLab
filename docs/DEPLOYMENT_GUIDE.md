# MockLab Production Deployment Guide

MockLab is designed for cloud-native deployment with frontend on Vercel and backend services on any containerized runtime (Render, Railway, Fly.io, AWS ECS, Google Cloud Run).

---

## Architecture Overview

```
Frontend: Next.js 15 (Edge/Node runtime) -> Vercel
Backend API: NestJS 11 -> Docker / Cloud Container Runtime
Database: PostgreSQL 16 -> Neon, Supabase, AWS RDS, or Managed Postgres
Cache/State: Redis 7 -> Upstash TCP / Managed Redis
```

---

## 1. Deploy Frontend on Vercel

### Step 1: Connect Git Repository
1. Import the repository into your Vercel team.
2. Select **Next.js** framework preset.
3. Configure the Root Directory or Build Command:
   - **Root Directory**: `.` (or select `apps/web`)
   - **Build Command**: `pnpm --filter @mocklab/web build`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `pnpm install`

### Step 2: Configure Environment Variables
Set the following in Vercel Project Settings:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## 2. Deploy Backend API

### Docker Container Build
From the monorepo root:
```bash
docker build -t mocklab-api -f apps/api/Dockerfile .
```

### Environment Variables
Configure on your backend hosting platform:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/mocklab?sslmode=require"
REDIS_URL="redis://default:password@host:6379"
JWT_SECRET="generate-a-strong-random-32-byte-hex-string"
ENCRYPTION_KEY="32-byte-hex-key-for-real-provider-credentials"
CORS_ORIGIN="https://your-mocklab-app.vercel.app"
```

### Database Migration
Run migrations before traffic switch:
```bash
pnpm --filter @mocklab/api prisma:deploy
```

---

## 3. High-Availability & Free-Tier Recommendations

| Component | Free / Low Cost Provider | Configuration |
|---|---|---|
| Web UI | **Vercel** Hobby | Edge CDN, instant previews, Zero Config Next.js 15 |
| API Engine | **Render** or **Railway** | Web Service with automatic git-triggered redeployment |
| PostgreSQL | **Neon** or **Supabase** | Serverless Postgres with connection pooling |
| Redis | **Aiven** or **Render** Redis | Standard TCP Redis instance for stateful scenario buckets |
