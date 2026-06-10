FROM node:22-bookworm AS builder

WORKDIR /lowdefy

COPY . .

# Enable pnpm using corepack
RUN corepack enable

# Build lowdefy app (Lowdefy config build + Vite client build)
RUN pnpx lowdefy@6 build --log-level=debug

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /lowdefy

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 lowdefy

COPY --from=builder --chown=lowdefy:nodejs /lowdefy/.lowdefy/server ./

USER lowdefy

EXPOSE 3000

ENV PORT=3000

CMD ["node", "src/index.js"]
