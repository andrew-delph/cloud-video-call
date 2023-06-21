
SHELL := /bin/bash

.PHONY: secrets

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
	make secrets || echo "secrets file doesnt exist"
	kubectl apply -f ./prometheus-pvc.yaml
	# helm upgrade --install prometheus-operator-crds --namespace=monitoring prometheus-community/prometheus-operator-crds
	make loki
	helm upgrade --install prometheus-rabbitmq-exporter prometheus-community/prometheus-rabbitmq-exporter -f prometheus-rabbitmq-exporter.values.yaml
	helm upgrade --install prometheus-adapter --namespace=monitoring prometheus-community/prometheus-adapter -f prometheus-adapter.values.yaml
	bash ./create_dashboards.sh

loki:
	K8_ALERTS=$$(wget -qO- https://raw.githubusercontent.com/samber/awesome-prometheus-alerts/master/dist/rules/kubernetes/kubestate-exporter.yml | yq eval '.groups' -) \
	RABBITMQ_ALERTS=$$(wget -qO- https://raw.githubusercontent.com/samber/awesome-prometheus-alerts/master/dist/rules/rabbitmq/rabbitmq-exporter.yml | yq eval '.groups' -) \
	CUSTOM_ALERTS=$$(cat ./custom-alerts.yaml | yq eval '.groups' -) \
		yq eval '.prometheus.serverFiles."alerting_rules.yml".groups = env(K8_ALERTS) + env(RABBITMQ_ALERTS) + env(CUSTOM_ALERTS)' loki-stack.values.yaml > loki-stack.values.modified.yaml
	
	# rules to delete...
	yq eval --inplace  'del(.prometheus.serverFiles."alerting_rules.yml".groups[].rules[] | select(.alert == "RabbitmqNodeDown"))' loki-stack.values.modified.yaml 
	helm upgrade --install loki --namespace=monitoring grafana/loki-stack -f loki-stack.values.modified.yaml

secrets:
	./generate-secrets.sh

delete:
	helm uninstall loki --namespace=monitoring --wait
	helm uninstall prometheus-rabbitmq-exporter --wait
	helm uninstall prometheus-adapter --namespace=monitoring --wait
	
delete_prom_pvc:
	kubectl delete -f ./prometheus-pvc.yaml --wait

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

prom_profile:
	go tool pprof -symbolize=remote -inuse_space http://node.andrewdelph.com:30002/debug/pprof/heap

prom_exec:
	kubectl exec -it -n monitoring -c prometheus-server deployments/loki-prometheus-server /bin/sh