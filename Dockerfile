#Started from the official repository https://hub.docker.com/_/node/
FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

RUN npm install -g forever

# Bundle app source
COPY . /usr/src/app

#Expose to docker daemon
EXPOSE 3000

#user forever with params or set environment in /docker/docker-compose.yml 
#forever start --minUptime 1000 --spinSleepTime 1000 ./bin/www site username password
CMD [ "npm", "start"]