
echo "installing helm"

helm upgrade --install  neo4j neo4j-helm/neo4j --version 4.1.0-3 --set core.standalone=true --set acceptLicenseAgreement=yes --set neo4jPassword=password -f k8.values.yaml

kubectl rollout status --watch --timeout=600s statefulset/neo4j