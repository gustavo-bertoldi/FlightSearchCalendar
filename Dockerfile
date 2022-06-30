FROM node:16-alpine

COPY front/package.json ./front/
COPY back/package.json ./back/

RUN npm install --prefix front
RUN npm install --prefix back

COPY . .

RUN npm run build --prefix front

COPY . .

EXPOSE $PORT

CMD npm run serve --prefix back
