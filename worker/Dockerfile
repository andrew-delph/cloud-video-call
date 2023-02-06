FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY common/package*.json ./common/
COPY worker/package*.json ./worker/

# Install production dependencies.
RUN cd common && npm install
RUN cd worker && npm install

# Copy local code to the container image.

COPY common common
RUN cd common && npm run build

COPY worker worker
RUN cd worker && npm run build

WORKDIR /usr/src/app/worker
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]