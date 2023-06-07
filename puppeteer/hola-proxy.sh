#!/bin/bash

set -e

docker pull yarmak/hola-proxy:latest

# (cd ~/git/hola-proxy && docker build . -t yarmak/hola-proxy:latest)



# docker run --rm -it \
#     --security-opt no-new-privileges \
#     -p 127.0.0.1:8080:8080 \
#     --name hola-proxy \
#     yarmak/hola-proxy:latest --help

# docker run --rm -it \
#     --security-opt no-new-privileges \
#     -p 127.0.0.1:8080:8080 \
#     --name hola-proxy \
#     yarmak/hola-proxy:latest -proxy-type peer  -force-port-field lum -country us -list-proxies -limit 10 


docker run --rm -it \
    --security-opt no-new-privileges \
    -p 127.0.0.1:8080:8080 \
    --network=host \
    --name hola-proxy \
    yarmak/hola-proxy:latest -proxy-type peer


# docker run --network=host --rm -it --name hola-proxy yarmak/hola-proxy:latest -proxy-type direct