
apply:
	make push
	make delete || echo "delete error"
	kubectl apply -f ./deployment.yaml --wait


delete:
	kubectl delete -f ./deployment.yaml --wait

image:
	bazel run image_flat

push:
	bazel run image_push

test:
	make image
	docker run -it -v ./screenshots:/screenshots/ --cap-add=NET_ADMIN bazel/puppeteer:image_flat


proxy:
	make image
	docker run -it -p 127.0.0.1:8080:8080 -e PROXY=true  --cap-add=NET_ADMIN bazel/puppeteer:image_flat


convert:
	ffmpeg -i input.mov -r 24 -c:v mjpeg -q:v 30 -vf "format=yuvj420p,scale=out_color_matrix=bt601" input.mjpeg
	ls -lh input.mjpeg


clean:
	sudo rm -rf screenshots/*

size:
	docker images --format "{{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep pupp

history:
	docker history bazel/puppeteer:image_flat