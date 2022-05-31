FROM node:18-alpine

WORKDIR /front

COPY package.json ./

RUN npm i

COPY . .

RUN npm run build

EXPOSE 8080

CMD npm run start
