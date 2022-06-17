FROM node:lts

WORKDIR /front

EXPOSE 5000

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

CMD npm run preview
