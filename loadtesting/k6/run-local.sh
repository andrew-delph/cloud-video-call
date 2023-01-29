#!/usr/bin/env zsh

set -e

if [ $# -ne 1 ]; then
    echo "Usage: ./run-local.sh <SCRIPT_NAME>"
    exit 1
fi

IMAGE_NAME=${IMAGE_NAME:="andrewdelph/k6_tests:latest"}

docker run --env REMOTE=true -v $PWD:/scripts -it --rm $IMAGE_NAME run /scripts/$1
