FROM node:18-alpine

WORKDIR /user/app

COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3006

CMD ["node", "server.js"]
