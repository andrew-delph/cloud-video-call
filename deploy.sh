#!/bin/bash

# Exit the script if any command fails
set -e

# Get all image_push targets
targets=$(bazel query //... | grep image_push)

# Run each image_push target
while read -r target; do
  echo "Running ${target}..."
  bazel run "${target}"
done <<< "${targets}"

echo "All image_push targets executed successfully."


kubectl rollout restart deployment/matcher
kubectl rollout restart deployment/matchmaker
kn service update options --image=andrewdelph/video-call-options:latest
kn service update websocket --image=andrewdelph/video-call-websocket:latest
kn service update neo4j-grpc-server --image=andrewdelph/video-call-neo4j-grpc-server:latest