FROM node:16

ARG PORT=3000
ARG FLY_INSTANCE_IP=flight-search.fly.dev

WORKDIR /front
COPY ./front/package.json .
COPY ./front/package-lock.json .
COPY ./front/svelte.config.js .
COPY ./front/vite.config.js .
COPY ./front/tsconfig.json .
COPY ./front/static ./static
COPY ./front/src ./src

RUN npm install
RUN echo "VITE_FLY_INSTANCE_IP=$FLY_INSTANCE_IP" > .env
RUN npm run build

WORKDIR /back
COPY ./back/package.json .
COPY ./back/package-lock.json .
COPY ./back/app.ts .
COPY ./back/decs.d.ts .
COPY ./back/tsconfig.json .

RUN npm install
RUN npm run build

EXPOSE 3000

CMD npm run start
