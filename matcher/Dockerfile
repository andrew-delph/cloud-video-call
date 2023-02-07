FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app


COPY common common
RUN cd common && npm install
RUN cd common && npm run build


COPY matcher matcher
RUN cd matcher && npm install
RUN cd matcher && npm run build

WORKDIR /usr/src/app/matcher
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]