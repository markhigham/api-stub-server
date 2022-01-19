FROM node:16-slim

WORKDIR /app
COPY package*.json ./

RUN npm install --production
COPY . ./

EXPOSE 3001

CMD [ "node", "/app/bin/api-stub-server.js" ]
