FROM node:16

WORKDIR /front
COPY ./front/package.json .
COPY ./front/svelte.config.js .
COPY ./front/tsconfig.json .
COPY ./front/.npmrc .
COPY ./front/static ./static
COPY ./front/src ./src

RUN npm install
RUN npm run build

WORKDIR /back
COPY ./back/package.json .
COPY ./back/app.js .

RUN npm install

EXPOSE 3000

CMD npm run serve
