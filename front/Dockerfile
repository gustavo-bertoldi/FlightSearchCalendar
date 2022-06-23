FROM node:lts

WORKDIR /front

EXPOSE $PORT

ENV HOST "0.0.0.0"

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

CMD npm run preview