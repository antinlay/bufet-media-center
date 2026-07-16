FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages ./packages
COPY apps/bufet-media-dashboard ./apps/bufet-media-dashboard

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bufet/shared build
RUN printf 'EXPO_PUBLIC_API_URL=%s\n' "$EXPO_PUBLIC_API_URL" > apps/bufet-media-dashboard/.env
RUN pnpm --filter @bufet/dashboard build:web

FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/apps/bufet-media-dashboard/dist ./dist

EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
