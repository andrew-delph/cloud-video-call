FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY common/package*.json ./common/
COPY functions/package*.json ./functions/

# Install production dependencies.
RUN cd common && npm install
RUN cd functions && npm install

# Copy local code to the container image.

COPY common common
COPY functions functions

RUN cd common && npm run build
RUN cd functions && npm run build

WORKDIR /usr/src/app/functions
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]