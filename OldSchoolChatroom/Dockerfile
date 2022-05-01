FROM node:14.4.0-alpine

RUN mkdir /project
WORKDIR /project

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
CMD [ "node", "app.js" ]]