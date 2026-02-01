FROM node:22-alpine

RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/digests.db

EXPOSE 8080

CMD ["node", "dist/index.js"]
