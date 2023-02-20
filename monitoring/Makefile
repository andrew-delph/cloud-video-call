
pgrafana:
	kubectl port-forward deployment/grafana 8081:3000

pprometheus:
	kubectl port-forward deployment/prometheus 8082:9090

apply:
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f ./resources/. -n monitoring
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack

delete:
	kubectl delete namespace monitoring
