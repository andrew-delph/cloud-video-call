
debug:
	kubectl run -it --rm --image neo4j:5.5.0 cypher-shell -- cypher-shell -a bolt://neo4j.default.svc.cluster.local

make apply:
	kubectl apply -f ./resources/.

make delete:
	kubectl delete -f ./resources/.