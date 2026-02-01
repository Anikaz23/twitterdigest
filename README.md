# Twitter Digest

AI-powered Twitter feed summarizer. Runs on a VPS, digests your Twitter "For You" feed every 3 hours, and displays summaries on a dashboard.

## Architecture

```
┌─────────────────────────────────────────┐
│              VPS (Docker)               │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   OpenClaw   │  │  Dashboard   │    │
│  │   Agent      │  │  (Next.js)   │    │
│  │   + Browser  │  │  Port 3000   │    │
│  └──────┬───────┘  └──────┬───────┘    │
│         └────────┬────────┘            │
│              SQLite DB                  │
└─────────────────────────────────────────┘
```

## Features

- Automatic Twitter feed digestion every 3 hours
- AI-generated summaries with topic extraction
- Clean dashboard to view digests
- VPS-agnostic (swap providers without code changes)
- Docker-based deployment

## Quick Start

### Deploy to VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Run setup script
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/twitterdigest/main/deploy/setup-vps.sh | bash

# Configure
cd ~/twitterdigest/deploy
cp .env.example .env
nano .env  # Add your ANTHROPIC_API_KEY

# Start
docker compose up -d
```

Access: `http://YOUR_VPS_IP:3000`

### Local Development

```bash
cd deploy
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

docker compose up --build
# Dashboard at http://localhost:3000
```

## Project Structure

```
twitterdigest/
├── dashboard/          # Next.js web app
├── agent/              # OpenClaw agent + browser
├── deploy/             # Docker Compose & scripts
├── shared/             # Database schema
└── README.md
```

## Requirements

- VPS with Docker (Oracle Cloud free tier works)
- Anthropic API key
- Twitter account (logged in via agent browser)

## Configuration

Edit `deploy/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## Commands

```bash
cd deploy

# Start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild
docker compose up -d --build
```

## Switching VPS

1. Set up new VPS with Docker
2. Clone repo and copy `.env`
3. Run `docker compose up -d`

No code changes needed.

## License

MIT
