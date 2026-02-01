FROM node:22-bookworm

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    sqlite3 \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium path for Puppeteer/Playwright
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Create directories
RUN mkdir -p /data /app/config /app/skills /root/.openclaw/workspace/skills

# Copy configuration
COPY config/openclaw.json /root/.openclaw/openclaw.json
COPY skills/ /root/.openclaw/workspace/skills/
COPY entrypoint.sh /app/entrypoint.sh
COPY save-digest.js /app/save-digest.js

# Install better-sqlite3 for save-digest script
RUN cd /app && npm init -y && npm install better-sqlite3

RUN chmod +x /app/entrypoint.sh

# Data volume for SQLite
VOLUME /data

ENV DB_PATH=/data/digests.db

ENTRYPOINT ["/app/entrypoint.sh"]
