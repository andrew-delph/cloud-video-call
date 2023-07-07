FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
COPY socketio-service/package*.json ./socketio-service/

# Install production dependencies.
RUN cd common && npm install
RUN cd neo4j/common-messaging && npm install
RUN cd socketio-service && npm install

# Copy local code to the container image.

COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build

COPY socketio-service socketio-service
RUN cd socketio-service && npm run build

WORKDIR /usr/src/app/socketio-service
# # Run the web service on container startup.
CMD [ "node", "./dist/socketio_server.js" ]