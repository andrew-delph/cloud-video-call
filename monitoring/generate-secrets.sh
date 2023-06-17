#!/bin/bash
set -e
OUTPUT=$(base64 -w0 alertmanager.yml)
echo "$OUTPUT"

sed -e "s|alertmanager.yml:.*|alertmanager.yml: $OUTPUT|"  secrets.yaml | kubectl apply -f -
echo Secrets deployed.