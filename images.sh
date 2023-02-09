#!/bin/bash

# Build
docker build -t andrewdelph/video-call-nginx:latest ./nginx
docker build -t andrewdelph/video-call-websocket:latest -f ./websocket/. .
docker build -t andrewdelph/video-call-matcher:latest -f ./matcher/. .
docker build -t andrewdelph/video-call-matchmaker:latest -f ./matchmaker/. .

docker push andrewdelph/video-call-nginx:latest 
docker push andrewdelph/video-call-websocket:latest 
docker push andrewdelph/video-call-matcher:latest 
docker push andrewdelph/video-call-matchmaker:latest 