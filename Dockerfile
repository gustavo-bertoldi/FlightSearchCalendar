FROM node:16-alpine

ARG AMADEUS_CLIENT_ID
ARG AMADEUS_CLIENT_SECRET
ARG ENV
ARG PORT

ENV AMADEUS_CLIENT_ID=$AMADEUS_CLIENT_ID
ENV AMADEUS_CLIENT_SECRET=$AMADEUS_CLIENT_SECRET
ENV ENV=$ENV
ENV PORT=$PORT

COPY front/package.json ./front/
COPY back/package.json ./back/

RUN npm install --prefix front
RUN npm install --prefix back

COPY . .

RUN npm run build --prefix front

COPY . .

EXPOSE $PORT

CMD npm run serve --prefix back
