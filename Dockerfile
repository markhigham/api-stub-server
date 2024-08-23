FROM node:20-slim AS base

WORKDIR /app
COPY package*.json ./

RUN npm install
COPY . ./
RUN npm run build

FROM base AS release

WORKDIR /app
COPY --from=base /app/static /app/static
COPY package*.json ./
RUN npm install --production

COPY --from=base /app/dist ./

EXPOSE 3001

CMD [ "node", "/app/dist/bin/api-stub-server.js" ]
