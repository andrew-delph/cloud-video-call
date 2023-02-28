FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

RUN npm i -g grpc-tools

COPY common/package*.json ./common/
RUN cd common && npm install

COPY neo4j/neo4j-grpc-common/package*.json ./neo4j/neo4j-grpc-common/
RUN cd neo4j/neo4j-grpc-common && npm install

COPY feedback/package*.json ./feedback/
RUN cd feedback && npm install

COPY common common
RUN cd common && npm run build

COPY neo4j/neo4j-grpc-common neo4j/neo4j-grpc-common
RUN cd neo4j/neo4j-grpc-common && npm run build

COPY feedback feedback
RUN cd feedback && npm run build

WORKDIR /usr/src/app/feedback
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]