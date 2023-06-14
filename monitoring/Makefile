
pgrafana:
	# kubectl port-forward deployment/grafana 8081:3000 -n monitoring
	kubectl --namespace monitoring port-forward svc/loki-grafana 3000:80

pprometheus:
	# kubectl port-forward deployment/prometheus 8082:9090 -n monitoring
	kubectl --namespace monitoring port-forward svc/loki-prometheus-server 3001:80

pexporter:
	kubectl --namespace monitoring port-forward svc/prometheus-rabbitmq-exporter 3002:9419

ploki:
	kubectl --namespace monitoring port-forward svc/loki 3003:3100

apply:
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo add grafana https://grafana.github.io/helm-charts
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	# helm upgrade --install prometheus-operator-crds --namespace=monitoring prometheus-community/prometheus-operator-crds
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-stack.values.yaml
	helm upgrade --install prometheus-rabbitmq-exporter prometheus-community/prometheus-rabbitmq-exporter -f prometheus-rabbitmq-exporter.values.yaml
	helm upgrade --install prometheus-adapter --namespace=monitoring prometheus-community/prometheus-adapter -f prometheus-adapter.values.yaml
	bash ./create_dashboards.sh
	kubectl apply -f secrets.yaml || echo "secrets file doesnt exist"

delete:
	helm uninstall loki --namespace=monitoring --wait
	helm uninstall prometheus-rabbitmq-exporter --wait
	helm uninstall prometheus-adapter --namespace=monitoring --wait

watch:
	watch kubectl get pods -n monitoring

query:
	@kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/" | jq
	@echo 1 ; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pod/*/matchmaker" | jq | grep value ; echo
	@echo 2 ; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pod/*/matcher" | jq | grep value ; echo

	@#echo 2 ; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/monitoring/pod/*/matchmaker" | jq | grep value  ; echo
	@#echo 3 ; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/metrics/matchmaker" | jq | grep value  ; echo
	@#echo 4 ; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/monitoring/metrics/matchmaker" | jq | grep value  ; echo
	@#echo ---
	@#echo 5; kubectl get --raw="/apis/custom.metrics.k8s.io/v1beta1/namespaces/monitoring/metrics/matchQueue" | jq | grep value ; echo 
	@#kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/monitorin/services/prometheus-rabbitmq-exporter/matcher | jq  | grep value ; echo "matchQueue"
	@#kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/default/services/prometheus-rabbitmq-exporter/matchmaker | jq | grep value ; echo "readyQueue" 
