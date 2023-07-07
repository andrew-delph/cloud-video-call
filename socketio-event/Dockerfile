FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
RUN cd common && npm install

COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
RUN cd neo4j/common-messaging && npm install

COPY socketio-event/package*.json ./socketio-event/
RUN cd socketio-event && npm install

COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build

COPY socketio-event socketio-event
RUN cd socketio-event && npm run build

WORKDIR /usr/src/app/socketio-event
# # Run the web service on container startup.
CMD [ "node", "./dist/socketio-event.js"]