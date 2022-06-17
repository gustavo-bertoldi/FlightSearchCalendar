FROM node:lts

WORKDIR /front

ENV PORT=5000
ENV HOST=0.0.0.0

COPY package.json .

RUN npm i

COPY . .

RUN npm run build

EXPOSE 5000

CMD npm run preview
