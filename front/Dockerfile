FROM node:18-alpine

WORKDIR /front

ENV PORT=5000
ENV HOST=0.0.0.0

COPY package.json ./
COPY rollup.config.js ./

RUN npm i

COPY . .

RUN npm run build

EXPOSE 5000

CMD npm run start
