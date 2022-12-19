FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./
COPY common/package*.json ./common/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install production dependencies.
RUN npm install concurrently
RUN npm install 

# Copy local code to the container image.

COPY . ./

RUN npm run build --prefix common
RUN npm run build --prefix server
RUN npm run build --prefix client


# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]