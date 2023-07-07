FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
RUN cd common && npm install

COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
RUN cd neo4j/common-messaging && npm install

COPY options-service/package*.json ./options-service/
RUN cd options-service && npm install

COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build

COPY options-service options-service
RUN cd options-service && npm run build

WORKDIR /usr/src/app/options-service
# # Run the web service on container startup.
CMD [ "node", "./dist/options-service.js" ]