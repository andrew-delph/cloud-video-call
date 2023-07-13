#!/bin/bash

# Enter the Neo4j pod
kubectl exec -it neo4j-0 -- /bin/bash -c "\
neo4j-admin server stop && \
neo4j-admin database dump neo4j && \
neo4j-admin server start"


# Copy the exported CSV file from the Neo4j pod to your local machine
kubectl cp neo4j-0:/var/lib/neo4j/data/dumps/neo4j.dump ./neo4j.dump
