kind: Service
apiVersion: v1
metadata:
  name: locust-master
  labels:
    app: locust-master
spec:
  ports:
    - port: 5557
      targetPort: loc-master-p1
      protocol: TCP
      name: loc-master-p1
    - port: 5558
      targetPort: loc-master-p2
      protocol: TCP
      name: loc-master-p2
  selector:
    app: locust-master
---
kind: Service
apiVersion: v1
metadata:
  name: locust-master-web
  labels:
    app: locust-master
spec:
  ports:
    - port: 8089
      targetPort: 8089
      protocol: TCP
      name: loc-master-web
  selector:
    app: locust-master
  type: LoadBalancer