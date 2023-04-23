
debug:
	kubectl run -it --rm --image neo4j:5.5.0 cypher-shell -- cypher-shell -a bolt://neo4j.default.svc.cluster.local

make apply:
	helm upgrade --install neo4j neo4j/neo4j -f k8.values.yaml
	# kubectl apply -f ./resources/.

make delete:
	helm uninstall neo4j