
pgrafana:
	# kubectl port-forward deployment/grafana 8081:3000 -n monitoring
	kubectl --namespace monitoring port-forward svc/kube-stack-grafana 3000:80

pprometheus:
	# kubectl port-forward deployment/prometheus 8082:9090 -n monitoring
	kubectl --namespace monitoring port-forward svc/prometheus-operated 3001:9090

apply:
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	helm upgrade --install kube-stack --namespace=monitoring prometheus-community/kube-prometheus-stack -f kube-stack.values.yaml
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-stack.values.yaml
	helm upgrade --install prometheus-rabbitmq-exporter --namespace=monitoring prometheus-community/prometheus-rabbitmq-exporter -f prometheus-rabbitmq-exporter.values.yaml
	helm upgrade --install prometheus-adapter --namespace=monitoring prometheus-community/prometheus-adapter -f prometheus-adapter.values.yaml
	bash ./create_dashboards.sh

delete:
	kubectl delete namespace monitoring

query_metrics:
	@kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/prometheus-rabbitmq-exporter/matchQueue | jq | grep value
	@kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/prometheus-rabbitmq-exporter/readyQueue | jq | grep value
