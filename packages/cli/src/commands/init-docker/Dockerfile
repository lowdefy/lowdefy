FROM node:18-buster AS builder

WORKDIR /lowdefy

COPY . .
# Configure standalone next build
ENV LOWDEFY_BUILD_OUTPUT_STANDALONE 1

# Enable pnpm using corepack
RUN corepack enable

# Build lowdefy app
RUN pnpx lowdefy@4 build --log-level=debug

FROM node:18-alpine AS runner

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /lowdefy

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 lowdefy

COPY --from=builder /lowdefy/.lowdefy/server/public ./public
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/.lowdefy/server/.next/standalone ./

USER lowdefy

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
