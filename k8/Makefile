
pnginx:
	while true; do \
        kubectl port-forward svc/nginx-lb 8888:80 || true; \
        sleep 1; \
    done
	

pneo4j:
	kubectl port-forward svc/neo4j tcp-bolt tcp-http tcp-https

predis:
	kubectl port-forward svc/redis 6379:6379

apply:
	kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
	kubectl apply -f https://github.com/knative/operator/releases/download/knative-v1.9.2/operator.yaml --wait
	kubectl apply -f ./knative.yaml --wait
	kubectl apply -f ./resources/.

delete:
	kubectl delete -f ./resources/.
	# kubectl delete -f ./knative.yaml

restart:
	kubectl rollout restart -f ./resources/.

pods:
	kubectl get pods

watch:
	watch 'kubectl get pods -n default && kubectl get hpa && kubectl get pods -n k6 && kubectl get pods -n monitoring && kubectl get pods -n knative-serving && kubectl top pod -A --sum'

services:
	kubectl get services

dashboard:
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml --wait
	open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
	kubectl proxy