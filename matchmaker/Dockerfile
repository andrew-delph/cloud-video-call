FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app


COPY common common
RUN cd common && npm install
RUN cd common && npm run build


COPY matchmaker matchmaker
RUN cd matchmaker && npm install
RUN cd matchmaker && npm run build

WORKDIR /usr/src/app/matchmaker
# # Run the web service on container startup.
CMD [ "npm", "run" , "prod" ]