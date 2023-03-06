
echo "installing helm"

helm upgrade --install neo4j neo4j/neo4j -f k8.values.yaml

kubectl rollout status --watch --timeout=600s statefulset/neo4j