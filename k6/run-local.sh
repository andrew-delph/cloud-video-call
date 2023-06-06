#!/bin/bash

set -e

if [ $# -ne 1 ]; then
    echo "Usage: ./run-local.sh <SCRIPT_NAME>"
    exit 1
fi

IMAGE_NAME=${IMAGE_NAME:="ghcr.io/andrew-delph/k6-tests:latest"}

echo $PWD

docker run -e "WS_HOST=ws://ws.andrewdelph.com/socket.io/?EIO=4&transport=websocket" -e "OPTIONS_HOST=http://options.andrewdelph.com" --network=host -v $PWD:/scripts -it --rm $IMAGE_NAME run /scripts/$1 --tag testid=local-test
