# distribution guide

# DEPRECIATED.
using locust with sockets sucks!

https://cloud.google.com/architecture/distributed-load-testing-using-gke

. ./variable.sh

# view pods

kubectl get pods -o wide -- watch

# view services

kubectl get services

# watch lb

kubectl get svc locust-master-web --watch
