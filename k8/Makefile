
pnginx:
	kubectl port-forward deployment/nginx 8080:80

pgrafana:
	kubectl port-forward deployment/grafana 8081:3000

pprometheus:
	kubectl port-forward deployment/prometheus 8082:9090

apply:
	kubectl apply -f .

delete:
	kubectl delete -f .

restart:
	kubectl rollout restart -f .

pods:
	kubectl get pods

services:
	kubectl get services