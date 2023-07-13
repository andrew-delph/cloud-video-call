
debug:
	kubectl run --rm -it --image "neo4j:5.7.0" cypher-shell -- cypher-shell -a "neo4j://neo4j.default.svc.cluster.local:7687" -u neo4j -p "password"

make pneo4j:
	make -C ../k8 pneo4j
