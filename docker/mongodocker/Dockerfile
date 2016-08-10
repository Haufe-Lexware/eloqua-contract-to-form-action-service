#Started from the official repository https://hub.docker.com/_/node/
FROM node:latest

# Install MongoDB.

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

RUN echo "deb http://downloads-distro.mongodb.org/repo/debian-sysvinit dist 10gen" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list

RUN apt-get update

# Install ps command
RUN apt-get install procps
#Alternate RUN apt-get install -y mongodb

RUN apt-get install -y mongodb-org

RUN mkdir -p /data/db

# Define mountable directories.
VOLUME ["/data/db"]

RUN service mongod start
# Expose ports.
#   - 27017: process
#   - 28017: http
EXPOSE 27017

# Set /usr/bin/mongod as the dockerized entry-point application
ENTRYPOINT ["/usr/bin/mongod"]
