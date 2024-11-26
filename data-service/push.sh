cd data-service && bazel run image_push && kn service update data-service --image=ghcr.io/andrew-delph/video-call-data-service:latest --no-wait && date || echo -en '\\0007'

# --wait --wait-timeout 60
 