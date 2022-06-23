FROM node:lts

WORKDIR /back

EXPOSE $PORT

COPY package.json .

RUN npm i

COPY . .

CMD npm run serve
