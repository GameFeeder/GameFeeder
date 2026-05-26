ARG NODE_VERSION=24.16.0

FROM node:${NODE_VERSION}-alpine AS production-dependencies
WORKDIR /app
COPY ./package.json ./package-lock.json /app/
RUN npm ci --omit=dev

FROM node:${NODE_VERSION}-alpine AS workspace
WORKDIR /app
COPY . .
RUN npm ci

FROM workspace AS build-dependencies
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS production
WORKDIR /app
COPY ./package.json .
COPY --from=build-dependencies /app/dist ./dist
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY config config
COPY data data

CMD ["npm", "run", "start"]
