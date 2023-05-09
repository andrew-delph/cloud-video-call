grpc_tools_node_protoc \
      --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
      --ts_out=grpc_js:./src/gen/ \
      --js_out=import_style=commonjs:./src/gen/ \
      --grpc_out=grpc_js:./src/gen/ \
      -I ./protos \
      ./protos/*.proto