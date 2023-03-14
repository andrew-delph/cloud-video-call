debug:
	kubectl run -it --rm --image neo4j:5.5.0 cypher-shell -- cypher-shell -a bolt://neo4j.default.svc.cluster.local

make apply:
	kubectl apply -f ./resources/.
	# helm install neo4j neo4j-helm/neo4j --version 4.1.0-3 --set core.standalone=true --set acceptLicenseAgreement=yes --set neo4jPassword=password
	# bash ./install.sh

make delete:
	kubectl delete -f ./resources/.
	# helm uninstall neo4j