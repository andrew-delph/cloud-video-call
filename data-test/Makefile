
debug:
	kubectl run --rm -it --image "neo4j:5.7.0" cypher-shell -- cypher-shell -a "neo4j://neo4j.default.svc.cluster.local:7687" -u neo4j -p "password"

make apply:
	kubectl label node minikube vke.vultr.com/node-pool=video-call || echo not local
	helm upgrade --install neo4j neo4j/neo4j -f k8.values.yaml # --version 5.6.0
	kubectl rollout status --watch --timeout=600s statefulset/neo4j

make delete:
	helm uninstall neo4j

make pneo4j:
	make -C ../k8 pneo4j
