	

pneo4j:
	kubectl port-forward svc/neo4j 7474:7474 7687:7687

predis:
	kubectl port-forward svc/redis 6379:6379

predisc:
	kubectl port-forward svc/redis-commander-svc 8081:8081

pkourier:
	kubectl port-forward svc/kourier -n knative-serving 8080:80

apply:
	kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml --wait
	kubectl create namespace knative-serving || echo "namespace already exists"
	kubectl apply -f https://github.com/knative/operator/releases/download/knative-v1.9.2/operator.yaml --wait
	kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml --wait
	kubectl apply -f https://github.com/knative/net-certmanager/releases/download/knative-v1.7.0/release.yaml --wait
	kubectl apply -f ./knative.yaml --wait
	kubectl apply -f ./resources/. --wait
	kubectl annotate domainmapping ws.andrewdelph.com kourier.knative.dev/disable-http2=true

delete:
	kubectl delete -f ./resources/.
	kubectl delete -f ./knative.yaml

restart:
	kubectl rollout restart -f ./resources/.

pods:
	kubectl get pods

watch:
	watch -n 15 'kubectl get pods -n default && kubectl get hpa'

top:
	kubectl top node && kubectl resource-capacity && kubectl top pod --sum --sort-by="cpu"

topa:
	kubectl top node && kubectl resource-capacity && kubectl top pod -A --sum --sort-by="cpu"

services:
	kubectl get services

dashboard:
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml --wait
	kubectl apply -f ./dashboard/. --wait
	open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
	kubectl proxy

evict:
	kubectl get po -A --all-namespaces -o json | jq  '.items[] | select(.status.reason!=null) | select(.status.reason | contains("Evicted")) | "kubectl delete po \(.metadata.name) -n \(.metadata.namespace)"' | xargs -n 1 bash -c

dtoken:
	kubectl -n kubernetes-dashboard create token admin-user | xclip -selection clipboard

ehosts:
	code /etc/hosts

curl:
	kubectl run -it --rm --image yauritux/busybox-curl sh

debug:
	kubectl run --rm -it --image "osexp2000/ubuntu-with-utils" bash --