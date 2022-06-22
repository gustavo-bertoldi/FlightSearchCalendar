FROM node:lts

WORKDIR /front

ENV PORT "$PORT"

EXPOSE $PORT

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

CMD npm run preview