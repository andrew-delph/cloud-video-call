FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY neo4j-grpc-common/package*.json ./neo4j-grpc-common/
COPY neo4j-grpc-server/package*.json ./neo4j-grpc-server/

# Install production dependencies.

RUN npm i -g grpc-tools

RUN cd neo4j-grpc-common && npm install --unsafe-perm
RUN cd neo4j-grpc-server && npm install --unsafe-perm

# Copy local code to the container image.

COPY neo4j-grpc-common neo4j-grpc-common
RUN cd neo4j-grpc-common && npm run build

COPY neo4j-grpc-server neo4j-grpc-server
RUN cd neo4j-grpc-server && npm run build

WORKDIR /usr/src/app/neo4j-grpc-server
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]