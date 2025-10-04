# --- Development / Build Stage ---
FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json yarn*.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Prisma (если используешь)
RUN yarn prisma generate
RUN yarn build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Только прод-зависимости
COPY package*.json yarn*.lock ./
RUN yarn install --production --frozen-lockfile

# Копируем только нужное из builder'а
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
