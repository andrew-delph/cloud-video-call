
echo "installing helm"

helm upgrade --install neo4j neo4j/neo4j -f k8.values.yaml