
apply:
	make image
	make push
	make delete || echo "delete error"
	kubectl apply -f ./deployment.yaml --wait
	sleep 20
	kubectl logs -f omegle-bot

delete:
	kubectl delete -f ./deployment.yaml

image:
	bazel run image

push:
	dbazel run image_push

test:
	make image
	docker run -it -v ./screenshots:/app/screenshots/ --cap-add=NET_ADMIN bazel/puppeteer:image


proxy:
	make image
	docker run -it -p 127.0.0.1:8080:8080 -e PROXY=true  --cap-add=NET_ADMIN bazel/puppeteer:image


convert:
	ffmpeg -i input.mov -r 24 -c:v mjpeg -q:v 30 -vf "format=yuvj420p,scale=out_color_matrix=bt601" input.mjpeg
	ls -lh input.mjpeg


clean:
	sudo rm -rf screenshots/*