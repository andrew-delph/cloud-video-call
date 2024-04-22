#!/bin/bash

# Exit the script if any command fails
set -e

# Get all image_push targets
targets=$(bazel query //... | grep 'image_build$')

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

kubectl rollout restart deployment/socketio-event
kubectl rollout restart deployment/matchmaker-event
kn service update options-service --image=ghcr.io/andrew-delph/video-call-options:latest --no-wait
kn service update socketio-service --image=ghcr.io/andrew-delph/video-call-socketio-service:latest --no-wait
kn service update data-service --image=ghcr.io/andrew-delph/video-call-data-service:latest --no-wait