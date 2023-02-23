
pnginx:
	kubectl port-forward deployment/nginx 8080:80

pneo4j:
	kubectl port-forward svc/neo4j tcp-bolt tcp-http tcp-https

apply:
	kubectl apply -f ./resources/.

delete:
	kubectl delete -f ./resources/.

restart:
	kubectl rollout restart -f ./resources/.

pods:
	kubectl get pods

watch:
	watch 'kubectl get pods && kubectl get hpa && kubectl get pods -n k6 && kubectl get pods -n monitoring'

services:
	kubectl get services