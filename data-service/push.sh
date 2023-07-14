cd data-service && bazel run image_push && kn service update data-service --image=ghcr.io/andrew-delph/video-call-data-service:latest --wait --wait-timeout 60 && date || echo -en '\\0007'
 