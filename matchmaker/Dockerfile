FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
RUN cd common && npm install


COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
RUN cd neo4j/common-messaging && npm install


COPY matchmaker/package*.json ./matchmaker/
RUN cd matchmaker && npm install


COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build


COPY matchmaker matchmaker
RUN cd matchmaker && npm run build

WORKDIR /usr/src/app/matchmaker
# # Run the web service on container startup.
CMD [ "node", "./dist/matchmaker.js" ]