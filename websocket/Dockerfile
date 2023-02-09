FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY common/package*.json ./common/
COPY websocket/package*.json ./websocket/

# Install production dependencies.
RUN cd common && npm install
RUN cd websocket && npm install

# Copy local code to the container image.

COPY common common
RUN cd common && npm run build

COPY websocket websocket
RUN cd websocket && npm run build

WORKDIR /usr/src/app/websocket
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]