FROM node:20-alpine AS builder

WORKDIR /app 

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .
RUN npm run build

# STAGE 2 -  PRODUCTION
FROM node:20-alpine AS production

WORKDIR /app 

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
EXPOSE 6060

CMD ["node", "dist/server.js"]