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