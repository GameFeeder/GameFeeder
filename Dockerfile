FROM node:10-alpine AS production-dependencies
WORKDIR /app
COPY ./package.json ./yarn.lock /app/
RUN yarn install --frozen-lockfile --production

# Bring only devDependencies
FROM production-dependencies AS build-dependencies
COPY . /app
RUN yarn install --frozen-lockfile
RUN yarn build

FROM mhart/alpine-node:slim-10 AS production
WORKDIR /app
COPY ./package.json /app/
COPY --from=build-dependencies /app/dist /app/dist
COPY --from=production-dependencies /app/node_modules /app/node_modules
ENV NODE_ENV=production
ENV LOG_LEVEL=info
CMD ["node", "/app/dist/_main.js"]
