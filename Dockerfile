FROM node:16

ARG PORT=3000
ARG EC2_INSTANCE_IP
ENV EC2_INSTANCE_IP=$EC2_INSTANCE_IP

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

EXPOSE $PORT

CMD npm run serve
