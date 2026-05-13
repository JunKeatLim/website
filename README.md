# FinSight — Company Intelligence Platform

## Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Upstash Redis (hot cache)
- **Primary data**: PitchBook API
- **Free sources**: NewsAPI, Clearbit Free, OpenCorporates
- **Hosting**: Vercel

---

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start local database and Redis
```bash
docker compose up -d
```

### 3. Configure environment variables
Edit `.env.local` with your values. For local Docker:
```
DATABASE_URL="postgresql://ftig120:ftig120dev@localhost:5432/ftig120?schema=public"
```

### 4. Run database migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the dev server
```bash
npm run dev
```

---

## API Keys

| Key | Required |
|-----|----------|
| PITCHBOOK_API_KEY | Yes |
| NEWSAPI_KEY | No (mock data fallback) |
| CLEARBIT_API_KEY | No (mock data fallback) |
| DATABASE_URL | Yes |
| UPSTASH_REDIS_REST_URL | No (cache disabled) |
| NEXTAUTH_SECRET | Yes |

---

## API Routes

| Route | Description |
|-------|-------------|
| GET /api/company/search?q= | Company lookup (cache-first) |
| GET /api/market | SG market snapshot |
| GET/POST/DELETE /api/watchlist | Watchlist management |

---

## Deployment (Vercel)
1. Push to GitHub
2. Import on vercel.com
3. Add all env vars in Vercel > Settings > Environment Variables
4. Set NEXTAUTH_URL to your production domain
