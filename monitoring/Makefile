
pgrafana:
	# kubectl port-forward deployment/grafana 8081:3000 -n monitoring
	kubectl --namespace monitoring port-forward svc/loki-grafana 3000:80

pprometheus:
	# kubectl port-forward deployment/prometheus 8082:9090 -n monitoring
	kubectl --namespace monitoring port-forward svc/loki-prometheus-server 3001:80

pexporter:
	kubectl --namespace monitoring port-forward svc/prometheus-rabbitmq-exporter 3002:9419

apply:
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	# helm upgrade --install kube-stack --namespace=monitoring prometheus-community/kube-prometheus-stack -f kube-stack.values.yaml
	# helm upgrade --install grafana --namespace=monitoring grafana/grafana -f grafana.values.yaml
	helm upgrade --install prometheus-operator-crds --namespace=monitoring prometheus-community/prometheus-operator-crds
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-stack.values.yaml
	helm upgrade --install prometheus-rabbitmq-exporter --namespace=monitoring prometheus-community/prometheus-rabbitmq-exporter -f prometheus-rabbitmq-exporter.values.yaml
	helm upgrade --install prometheus-adapter --namespace=monitoring prometheus-community/prometheus-adapter -f prometheus-adapter.values.yaml
	bash ./create_dashboards.sh

delete:
	kubectl delete namespace monitoring

watch:
	watch kubectl get pods -n monitoring

query_metrics:
	@kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/prometheus-rabbitmq-exporter/matchQueue | jq  | grep value ; echo "matchQueue"
	@kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/prometheus-rabbitmq-exporter/readyQueue | jq | grep value ; echo "readyQueue" 
