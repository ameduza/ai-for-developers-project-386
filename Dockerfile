# syntax=docker/dockerfile:1

FROM node:24.16.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY e2e/package.json ./e2e/
COPY server/package.json server/package-lock.json ./server/
COPY typespec/package.json typespec/package-lock.json ./typespec/
RUN HUSKY=0 npm ci

COPY client ./client
COPY server ./server
COPY typespec ./typespec
RUN npm run build:production

FROM node:24.16.0-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force

WORKDIR /app
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist

USER node
EXPOSE 3000

CMD ["node", "server/dist/server.js"]
