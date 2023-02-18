
pnginx:
	kubectl port-forward deployment/nginx 8080:80

pgrafana:
	kubectl port-forward deployment/grafana 8081:3000

pprometheus:
	kubectl port-forward deployment/prometheus 8082:9090

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
	watch 'kubectl get pods && echo "other command"'

services:
	kubectl get services