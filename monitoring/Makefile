
pgrafana:
	kubectl port-forward deployment/grafana 8081:3000 -n monitoring

pprometheus:
	kubectl port-forward deployment/prometheus 8082:9090 -n monitoring

apply:
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	# helm install kube-prom prometheus-community/kube-prometheus-stack -n monitoring
	kubectl apply -f ./resources/. -n monitoring
	
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-values.yaml
	helm upgrade loki --namespace=monitoring grafana/loki-stack -f loki-values.yaml --dry-run > release.yaml

delete:
	kubectl delete namespace monitoring
