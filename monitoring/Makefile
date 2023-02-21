
pgrafana:
	# kubectl port-forward deployment/grafana 8081:3000 -n monitoring
	kubectl --namespace monitoring port-forward svc/kube-stack-grafana 3000:80

pprometheus:
	# kubectl port-forward deployment/prometheus 8082:9090 -n monitoring
	kubectl --namespace monitoring port-forward svc/prometheus-operated 3001:9090

apply:
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	helm upgrade --install kube-stack --namespace=monitoring prometheus-community/kube-prometheus-stack -f kube-stack.values.yaml
	helm upgrade --install prometheus-rabbitmq-exporter --namespace=monitoring prometheus-community/prometheus-rabbitmq-exporter -f prometheus-rabbitmq-exporter.values.yaml
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-stack-values.yaml

	# helm install kube-prom prometheus-community/kube-prometheus-stack -n monitoring
	# kubectl apply -f ./resources/. -n monitoring
	

delete:
	kubectl delete namespace monitoring
