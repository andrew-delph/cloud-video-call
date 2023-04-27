grpc_tools_node_protoc \
      --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
      --ts_out=grpc_js:./src/ \
      --js_out=import_style=commonjs:./src/ \
      --grpc_out=grpc_js:./src/ \
      -I ./protos \
      ./protos/*.proto