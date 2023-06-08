
apply:
	make push
	kubectl apply -f ./resources/. --wait
	kubectl rollout restart deployment/puppeteer -n bot
	kubectl rollout status deployment/puppeteer -n bot --watch=true --timeout=300s
	kubectl wait --for condition=Ready --timeout=60s -n bot deployment/puppeteer


pods:
	kubectl get pods -n bot

top:
	kubectl top pod -n bot --sum --sort-by="memory"


delete:
	kubectl delete -f ./resources/deployment.yaml --wait

image:
	bazel run image

push:
	bazel run image_push

test:
	make image
	docker run --rm -it -v ./screenshots:/screenshots/ --cap-add=NET_ADMIN bazel/puppeteer:image

bash:
	make image
	docker run --rm -it -v ./screenshots:/screenshots/ --cap-add=NET_ADMIN bazel/puppeteer:image bash

logs:
	make apply
	@echo -e "\n\n\n---------LOGS---------\n\n"
	kubectl logs -n bot -f deployment/puppeteer

proxy:
	make image
	docker run -it -p 127.0.0.1:8080:8080 -e PROXY=true  --cap-add=NET_ADMIN bazel/puppeteer:image


convert:
	ffmpeg -i input.mov -r 24 -c:v mjpeg -q:v 30 -vf "format=yuvj420p,scale=out_color_matrix=bt601" input.mjpeg
	ls -lh input.mjpeg


clean:
	sudo rm -rf screenshots/*

size:
	docker images --format "{{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep pupp

history:
	docker history bazel/puppeteer:image