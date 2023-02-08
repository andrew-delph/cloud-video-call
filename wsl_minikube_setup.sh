#!/bin/bash

# Specify the container name or ID
container_name="minikube"

# Specify the container port you want to retrieve the host port for
container_port=8443

# Get the network information for the container in JSON format
network_info=$(docker inspect --format='{{json .NetworkSettings.Ports}}' $container_name)

# Extract the host port for the specified container port
host_port=$(echo $network_info | jq -r --arg container_port "$container_port/tcp" '.[$container_port][0].HostPort')

# Set the file path
file_path="$HOME/.kube/config"

# Use sed to replace the value of 25191 with the host port
sed -i "s/https:\/\/127.0.0.1:[0-9]\+/https:\/\/127.0.0.1:$host_port/g" $file_path