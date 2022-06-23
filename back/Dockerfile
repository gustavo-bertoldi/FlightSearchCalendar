FROM node:lts

WORKDIR /back

EXPOSE $PORT

ENV ENV $ENV

COPY package.json .

RUN npm i

COPY . .

CMD npm run serve
