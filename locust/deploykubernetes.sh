envsubst < kubernetes/locust-master-controller.yaml.tpl | kubectl apply -f -
envsubst < kubernetes/locust-worker-controller.yaml.tpl | kubectl apply -f -
envsubst < kubernetes/locust-master-service.yaml.tpl | kubectl apply -f -

echo "watching pods"
echo ""
kubectl get pods -o wide --watch

echo "watching services"
echo ""
kubectl get svc locust-master-web --watch