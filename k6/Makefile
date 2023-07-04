
export IMAGE_NAME=andrewdelph/k6_tests:latest


build:
	docker build -t andrewdelph/k6-tests:latest .
	docker push andrewdelph/k6-tests:latest

init:
	@echo "init"
	kubectl config current-context | grep -q "minikube" || (echo "Error: Current context is not minikube" >&2 && exit 1)
	rm -rf dependencies
	mkdir dependencies
	mkdir dependencies/k6-operator
	mkdir dependencies/xk6-output-prometheus-remote
	git clone https://github.com/grafana/k6-operator.git dependencies/k6-operator
	git clone https://github.com/grafana/xk6-output-prometheus-remote.git dependencies/xk6-output-prometheus-remote
	cd dependencies/k6-operator && make deploy

setup:
	npm run webpack > /dev/null
	kubectl --context minikube create namespace k6 || echo "namespace already exists"
	kubectl --context minikube delete configmap test-scripts --ignore-not-found -n k6
	kubectl --context minikube delete configmap prometheus-config --ignore-not-found -n k6
	kubectl --context minikube create configmap test-scripts  \
		--from-file=./dist/k6_run.js -n k6


run:
	make setup
	./run-kube.sh resources/k6-output-grafana-cloud.yaml

prod:
	make setup
	./run-kube.sh resources/k6-output-grafana-cloud.yaml --external

watch:
	watch -n 15 kubectl --context minikube get pods -n k6

delete:
	kubectl --context minikube delete  -f resources/k6-output-grafana-cloud.yaml -n k6
	# cd dependencies/k6-operator && make delete

