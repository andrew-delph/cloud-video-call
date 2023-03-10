
export IMAGE_NAME=andrewdelph/k6_tests:latest

gcloud:
	gcloud container clusters describe k6-cluster --region us-central1 --project react-video-call-thing72 || gcloud container clusters create-auto k6-cluster --region us-central1 --project react-video-call-thing72; 
	gcloud container clusters get-credentials k6-cluster --region us-central1 --project=react-video-call-thing72

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

	kubectl create namespace k6 || echo "namespace already exists"

	kubectl delete configmap test-scripts --ignore-not-found -n k6

	kubectl delete configmap prometheus-config --ignore-not-found -n k6

	kubectl create configmap test-scripts  \
		--from-file=./dist/k6_exp.js -n k6


run:
	make setup
	./run-kube.sh resources/k6-output-grafana-cloud.yaml


pods:
	kubectl get pods  --watch -n k6

delete:
	kubectl delete  -f resources/k6-output-grafana-cloud.yaml -n k6
	# cd dependencies/k6-operator && make delete



