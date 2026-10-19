FROM oven/bun:1.3 AS dependencies

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma"
RUN bunx --bun prisma generate

FROM oven/bun:1.3 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/src/generated ./src/generated

COPY package.json bun.lock ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY lib ./lib

USER bun

CMD ["bun", "run", "src/index.ts"]
