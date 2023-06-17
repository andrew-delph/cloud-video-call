#!/bin/bash
set -e

# Run the 'kubectl ctx' command and capture the output
ctx=$(kubectl config current-context)

# Check if the context is "minikube"
if echo "$ctx" | grep -q "minikube"; then
  echo "Minikube context detected. Exiting..."
  exit 1
fi

OUTPUT=$(base64 -w0 alertmanager.yml)
echo "$OUTPUT"

sed -e "s|alertmanager.yml:.*|alertmanager.yml: $OUTPUT|"  secrets.yaml | kubectl apply -f -
echo Secrets deployed.