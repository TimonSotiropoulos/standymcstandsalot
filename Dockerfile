FROM node:5.4

MAINTAINER Timon Sotiropoulos, timon@seeddigital.co

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install

CMD ["npm", "start"]
