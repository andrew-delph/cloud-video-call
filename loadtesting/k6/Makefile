
export IMAGE_NAME=andrewdelph/k6_tests:latest

gcloud:
	@if gcloud container clusters describe k6-cluster --region us-central1 --project react-video-call-thing72 &>/dev/null; then \
		echo "Cluster already exists, skipping creation"; \
	else \
		gcloud container clusters create-auto k6-cluster --region us-central1 --project react-video-call-thing72; \
	fi
	gcloud container clusters get-credentials k6-cluster \
    	--region us-central1 \
    	--project=react-video-call-thing72

build:
	docker build -t andrewdelph/k6-tests:latest .
	docker push andrewdelph/k6-tests:latest

init:
	@echo "init"
	rm -rf dependencies
	mkdir dependencies
	mkdir dependencies/k6-operator
	mkdir dependencies/xk6-output-prometheus-remote
	git clone https://github.com/grafana/k6-operator.git dependencies/k6-operator
	git clone https://github.com/grafana/xk6-output-prometheus-remote.git dependencies/xk6-output-prometheus-remote
	cd dependencies/k6-operator && make deploy

setup:
	npm run webpack

	kubectl delete namespace k6-tests --ignore-not-found

	kubectl create namespace k6-tests

	kubectl create configmap test-scripts -n k6-tests \
		--from-file=./dist/main.js

	kubectl create configmap -n k6-tests prometheus-config --from-literal="K6_PROMETHEUS_RW_SERVER_URL=https://prometheus-us-central1.grafana.net/api/prom/push"

	kubectl create secret -n k6-tests generic prometheus-secrets \
		--from-literal=K6_PROMETHEUS_RW_USERNAME=${K6_PROMETHEUS_RW_USERNAME} \
		--from-literal=K6_PROMETHEUS_RW_PASSWORD=${K6_PROMETHEUS_RW_PASSWORD}


run:
	./run-kube.sh resources/k6-output-grafana-cloud.yaml

pods:
	kubectl get pods -n k6-tests --watch

delete:
	kubectl delete -n k6-tests -f resources/k6-output-grafana-cloud.yaml
	cd dependencies/k6-operator && make delete


local:
	./run-local.sh dist/main.js

