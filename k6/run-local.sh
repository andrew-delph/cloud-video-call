#!/bin/bash

set -e

if [ $# -ne 1 ]; then
    echo "Usage: ./run-local.sh <SCRIPT_NAME>"
    exit 1
fi

IMAGE_NAME=${IMAGE_NAME:="andrewdelph/k6-tests:latest"}

echo $PWD


k6 run --env "WS_HOST=ws://ws.andrewdelph.com/socket.io/?EIO=4&transport=websocket" --env "OPTIONS_HOST=http://options.andrewdelph.com" dist/k6_run.js
