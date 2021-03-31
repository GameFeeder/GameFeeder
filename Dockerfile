FROM node:12.22.0-alpine3.12 AS production-dependencies
WORKDIR /app
COPY ./package.json ./yarn.lock /app/
RUN yarn install --frozen-lockfile --production

# Bring only devDependencies
FROM production-dependencies AS workspace
RUN yarn install --frozen-lockfile
COPY . .

FROM workspace AS build-dependencies
RUN yarn build

FROM node:12.22.0-alpine3.12 AS production
WORKDIR /app
COPY ./package.json .
COPY --from=build-dependencies /app/dist ./dist
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY ./config/games ./config/games
ENV NODE_ENV=production
ENV LOG_LEVEL=info
CMD ["node", "/app/dist/src/_main.js"]
