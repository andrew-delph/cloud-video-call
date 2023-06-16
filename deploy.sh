#!/bin/bash

# Exit the script if any command fails
set -e

# Get all image_push targets
targets=$(bazel query //... | grep image_push)

# Run each image_push target
while read -r target; do
  if [[ "$target" == *"puppeteer"* ]]; then
    echo "Skipping ${target}..."
    continue
  fi
  echo "Running ${target}..."
  bazel run "${target}"
done <<< "${targets}"


echo "All image_push targets executed successfully."

kn version

kubectl rollout restart deployment/matcher
kubectl rollout restart deployment/matchmaker
kn service update options --image=ghcr.io/andrew-delph/video-call-options:latest 
kn service update websocket --image=ghcr.io/andrew-delph/video-call-websocket:latest 
kn service update neo4j-grpc-server --image=ghcr.io/andrew-delph/video-call-neo4j-grpc-server:latest 