FROM node:18-alpine

ARG AMADEUS_CLIENT_ID
ARG AMADEUS_CLIENT_SECRET
ARG ENV
ARG PORT

ENV AMADEUS_CLIENT_ID=$AMADEUS_CLIENT_ID
ENV AMADEUS_CLIENT_SECRET=$AMADEUS_CLIENT_SECRET
ENV ENV=$ENV
ENV PORT=$PORT

COPY package.json ./
COPY front/package.json ./front/
COPY back/package.json ./back/

RUN npm run docker-install

COPY . .

RUN npm run docker-build

COPY . .

EXPOSE $PORT

CMD npm run start
