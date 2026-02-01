# Twitter Digest Deployment

Deploy the Twitter Digest tool to any VPS.

## Quick Start

### 1. Set up your VPS

SSH into your VPS and run:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/twitterdigest/main/deploy/setup-vps.sh | bash
```

Or manually:

```bash
git clone https://github.com/YOUR_USERNAME/twitterdigest.git
cd twitterdigest/deploy
cp .env.example .env
# Edit .env with your Anthropic API key
docker compose up -d
```

### 2. Configure

Edit `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 3. Open Firewall

Allow port 3000:

**Oracle Cloud:**
- Go to Networking > Virtual Cloud Networks > Your VCN > Security Lists
- Add Ingress Rule: Source 0.0.0.0/0, Port 3000

**AWS:**
```bash
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 3000 --cidr 0.0.0.0/0
```

**UFW (Ubuntu):**
```bash
sudo ufw allow 3000/tcp
```

### 4. Access Dashboard

Open `http://YOUR_VPS_IP:3000` in your browser.

## Commands

```bash
# View logs
docker compose logs -f

# View agent logs only
docker compose logs -f agent

# Restart
docker compose restart

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## Twitter Authentication

The first time the agent runs, it will need you to log into Twitter. To do this:

1. Check agent logs for the authentication prompt
2. (Future: VNC access to browser or manual cookie import)

## Switching VPS

To migrate to a new VPS:

1. Stop containers on old VPS: `docker compose down`
2. (Optional) Export data: `docker compose exec dashboard sqlite3 /data/digests.db .dump > backup.sql`
3. Set up new VPS following Quick Start
4. (Optional) Import data: copy backup.sql and run `.read backup.sql`

No code changes needed - the Docker setup is VPS-agnostic.

## Troubleshooting

**Dashboard shows no digests:**
- Check agent logs: `docker compose logs agent`
- Verify API key is set in `.env`

**Can't access dashboard:**
- Check firewall rules
- Verify containers are running: `docker compose ps`

**Agent fails to load Twitter:**
- Twitter may require authentication
- Check for rate limiting
