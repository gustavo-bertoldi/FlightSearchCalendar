FROM node:16

ARG PORT=3000

WORKDIR /front
COPY ./front/package.json .
COPY ./front/svelte.config.js .
COPY ./front/vite.config.js .
COPY ./front/tsconfig.json .
COPY ./front/static ./static
COPY ./front/src ./src

RUN npm install
RUN npm run build

WORKDIR /back
COPY ./back/package.json .
COPY ./back/app.ts .
COPY ./back/decs.d.ts .
COPY ./back/tsconfig.json .

RUN npm install
RUN npm run build

EXPOSE $PORT

CMD npm run start
