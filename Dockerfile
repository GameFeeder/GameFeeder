FROM node:20.15.1-alpine3.19 AS production-dependencies
WORKDIR /app
COPY ./package.json ./package-lock.json /app/
RUN npm ci --omit=dev

# Bring only devDependencies
FROM production-dependencies AS workspace
RUN npm ci
COPY . .

FROM workspace AS build-dependencies
RUN npm run build

FROM node:20.15.1-alpine3.19 AS production
WORKDIR /app
COPY ./package.json .
COPY --from=build-dependencies /app/dist ./dist
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY ./config/games ./config/games
ENV NODE_ENV=production
ENV LOG_LEVEL=info
CMD ["node", "--loader", "commonjs-extension-resolution-loader", "/app/dist/src/_main.js"]
