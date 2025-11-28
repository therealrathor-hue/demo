FROM node:18-alpine

WORKDIR /user/app

COPY ./package*.json /user/app
RUN npm install --production

COPY . .

EXPOSE 3006

CMD ["npm", "start"]
