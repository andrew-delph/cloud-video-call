FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

RUN apt update && apt install wget -y

RUN GRPC_HEALTH_PROBE_VERSION=v0.4.13 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# Install
COPY common/package*.json ./common/
RUN cd common && npm install

COPY neo4j/common-messaging/package*.json ./neo4j/common-messaging/
RUN cd neo4j/common-messaging && npm install

COPY neo4j/neo4j-jobs/package*.json ./neo4j/neo4j-jobs/
RUN cd neo4j/neo4j-jobs && npm install

# Copy and Build
COPY common common
RUN cd common && npm run build

COPY neo4j/common-messaging neo4j/common-messaging
RUN cd neo4j/common-messaging && npm run build

COPY neo4j/neo4j-jobs neo4j/neo4j-jobs
RUN cd neo4j/neo4j-jobs && npm run build

WORKDIR /usr/src/app/neo4j/neo4j-jobs
# # Run the web service on container startup.
CMD [ "node", "./dist/index.js" ]