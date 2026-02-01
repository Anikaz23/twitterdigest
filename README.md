# Twitter Digest

AI-powered Twitter feed summarizer. Runs on a VPS, digests your Twitter "For You" feed every 3 hours, and displays summaries on a globally-distributed dashboard.

## Architecture

```
Vercel (Global Edge)                 VPS (Oracle Cloud)
┌─────────────────────┐              ┌─────────────────────┐
│     Dashboard       │              │   Docker Compose    │
│     (Next.js)       │    HTTPS     │  ┌───────────────┐  │
│                     │ ────────────►│  │  API Server   │  │
│  Fast everywhere    │              │  └───────┬───────┘  │
│                     │              │          │          │
│  platform.ts        │              │  ┌───────▼───────┐  │
│  (edge isolation)   │              │  │    Agent      │  │
└─────────────────────┘              │  │  + Browser    │  │
                                     │  └───────┬───────┘  │
                                     │          │          │
                                     │  ┌───────▼───────┐  │
                                     │  │   SQLite DB   │  │
                                     │  └───────────────┘  │
                                     └─────────────────────┘
```

## Features

- Automatic Twitter feed digestion every 3 hours
- AI-generated summaries with topic extraction
- Dashboard on Vercel Edge (fast globally)
- VPS-agnostic (swap Oracle for any provider)
- Platform-agnostic dashboard (swap Vercel for any host)
- Edge-specific code isolated to ONE file

## Quick Start

### 1. Deploy API + Agent to VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone and configure
git clone https://github.com/YOUR_USERNAME/twitterdigest.git
cd twitterdigest/deploy
cp .env.example .env
nano .env  # Add ANTHROPIC_API_KEY

# Start
docker compose up -d
```

Open firewall port 8080.

### 2. Deploy Dashboard to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy dashboard
cd dashboard
vercel

# Set environment variable in Vercel dashboard:
# API_URL = http://YOUR_VPS_IP:8080
# NEXT_PUBLIC_API_URL = http://YOUR_VPS_IP:8080
```

Access your dashboard at your Vercel URL.

## Project Structure

```
twitterdigest/
├── dashboard/          # Next.js (deploys to Vercel)
│   └── src/lib/
│       ├── platform.ts         # ⚡ Edge-specific (only file to change)
│       ├── platform.standard.ts # Non-edge fallback
│       └── api.ts              # API client
├── server/             # Express API (runs on VPS)
├── agent/              # OpenClaw + browser (runs on VPS)
├── deploy/             # Docker Compose & scripts
└── shared/             # Types & schema
```

## Switching Platforms

### Switch VPS (Oracle → Any)
1. Spin up new VPS with Docker
2. Run setup script
3. Update `API_URL` in Vercel
4. No code changes

### Switch Dashboard Host (Vercel → Netlify/Docker)
1. Copy `platform.standard.ts` to `platform.ts`
2. Deploy to new platform
3. **Only ONE file changes**

## Configuration

**VPS** (`deploy/.env`):
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

**Dashboard** (Vercel environment variables):
```
API_URL=http://YOUR_VPS_IP:8080
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:8080
```

## Commands

```bash
cd deploy

# Start VPS services
docker compose up -d

# View logs
docker compose logs -f

# View API logs only
docker compose logs -f api

# Stop
docker compose down

# Rebuild
docker compose up -d --build
```

## Requirements

- VPS with Docker (Oracle Cloud free tier works)
- Vercel account (free tier works)
- Anthropic API key
- Twitter account

## License

MIT
