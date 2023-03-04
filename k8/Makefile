
pnginx:
	kubectl port-forward deployment/nginx 8888:80

pneo4j:
	kubectl port-forward svc/neo4j tcp-bolt tcp-http tcp-https

apply:
	kubectl apply -f https://github.com/knative/operator/releases/download/knative-v1.9.2/operator.yaml --wait
	kubectl apply -f ./knative.yaml --wait
	kubectl apply -f ./resources/.

delete:
	kubectl delete -f ./resources/.
	kubectl delete -f ./knative.yaml

restart:
	kubectl rollout restart -f ./resources/.

pods:
	kubectl get pods

watch:
	watch 'kubectl get pods -n default && kubectl get hpa && kubectl get pods -n k6 && kubectl get pods -n monitoring'

services:
	kubectl get services