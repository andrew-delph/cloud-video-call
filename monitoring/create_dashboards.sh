#!/bin/bash


# delete existing dashboards (including default)
kubectl delete configmap --selector custom_dashboard='1' -n monitoring

# Set the directory path
dir_path="./dashboards"

# Loop through all files in the directory
for file_path in $dir_path/*; do
  file_name=$(basename "${file_path%.*}")

  # # Create the ConfigMap using the file contents and name as the ConfigMap name
  kubectl create configmap "$file_name" --from-file="$file_path" -n monitoring

  # # Add labels to the ConfigMap
  kubectl label configmap "$file_name" grafana_dashboard='1' custom_dashboard='1' -n monitoring

done