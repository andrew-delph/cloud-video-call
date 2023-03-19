mkdir -p src/proto_gen
grpc_tools_node_protoc \
      --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
      --ts_out=grpc_js:./src/proto_gen \
      --js_out=import_style=commonjs:./src/proto_gen \
      --grpc_out=grpc_js:./src/proto_gen \
      -I ./protos \
      ./protos/*.proto