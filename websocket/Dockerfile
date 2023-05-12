FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
COPY websocket/package*.json ./websocket/

# Install production dependencies.
RUN cd common && npm install
RUN cd neo4j/common-messaging && npm install
RUN cd websocket && npm install

# Copy local code to the container image.

COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build

COPY websocket websocket
RUN cd websocket && npm run build

WORKDIR /usr/src/app/websocket
# # Run the web service on container startup.
CMD [ "node", "./dist/socketio_server.js" ]