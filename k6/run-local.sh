#!/bin/bash

set -e

if [ $# -ne 1 ]; then
    echo "Usage: ./run-local.sh <SCRIPT_NAME>"
    exit 1
fi

IMAGE_NAME=${IMAGE_NAME:="andrewdelph/k6-tests:latest"}

echo $PWD

docker run -e "WS_HOST=ws://ws.solarsim.net/socket.io/?EIO=4&transport=websocket" -e "OPTIONS_HOST=http://options.solarsim.net" --network=host -v $PWD:/scripts -it --rm $IMAGE_NAME run /scripts/$1 
