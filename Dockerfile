FROM node:26.13.0-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@12.18.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG DEPLOYMENT_REVISION
ENV NEXT_DEPLOYMENT_ID=$DEPLOYMENT_REVISION
RUN test -n "$DEPLOYMENT_REVISION" && pnpm build

FROM node:26.13.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
ARG DEPLOYMENT_REVISION
LABEL org.opencontainers.image.revision=$DEPLOYMENT_REVISION
ENV DEPLOYMENT_REVISION=$DEPLOYMENT_REVISION
LABEL org.opencontainers.image.source=https://github.com/bigint/k3s-yoginth-com
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/info').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
