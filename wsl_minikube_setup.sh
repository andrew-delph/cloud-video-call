#!/bin/bash

# Specify the container name or ID
container_name="your_container_name_or_id"

# Specify the container port you want to retrieve the host port for
container_port=8443

# Get the network information for the container in JSON format
network_info=$(docker inspect --format='{{json .NetworkSettings.Ports}}' $container_name)

# Extract the host port for the specified container port
host_port=$(echo $network_info | jq -r --arg container_port "$container_port/tcp" '.[$container_port][0].HostPort')

# Print the host port
echo "The host port for container port $container_port is: $host_port"