# Building

FROM node:18-alpine AS base

WORKDIR /app/

COPY . /app/

RUN npm ci
RUN npm run build

# Deploy

FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app/

COPY --from=base /app/dist .

RUN npm ci --production

RUN npm run deploy-commands

CMD ["npm", "start"]