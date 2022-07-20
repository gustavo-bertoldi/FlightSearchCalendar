FROM node:16

ARG PORT=3000
ARG EC2_INSTANCE_IP

WORKDIR /front
COPY ./front/package.json .
COPY ./front/svelte.config.js .
COPY ./front/vite.config.js .
COPY ./front/tsconfig.json .
COPY ./front/static ./static
COPY ./front/src ./src

RUN npm install
RUN touch .env
RUN echo "VITE_EC2_INSTANCE_IP=$EC2_INSTANCE_IP" > .env
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
