FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
RUN cd common && npm install

COPY neo4j/neo4j-grpc-common/package*.json ./neo4j/neo4j-grpc-common/
RUN cd neo4j/neo4j-grpc-common && npm install

COPY matcher/package*.json ./matcher/
RUN cd matcher && npm install

COPY common common
RUN cd common && npm run build

COPY neo4j/neo4j-grpc-common neo4j/neo4j-grpc-common
RUN cd neo4j/neo4j-grpc-common && npm run build

COPY matcher matcher
RUN cd matcher && npm run build

WORKDIR /usr/src/app/matcher
# # Run the web service on container startup.
CMD [ "node", "./dist/match-worker.js"]