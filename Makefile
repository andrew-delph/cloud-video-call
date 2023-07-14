format:
	prettier --ignore-path .prettierignore --write  . || echo "silly error"
	(cd flutter_app && make format)


prettierignore:
	find . -type d -name 'node_modules' -prune -o -type f -name '.gitignore' -exec sh -c 'echo "### {} ###"; sed "s|^./|$(dirname {})/|" {}' \; > .prettierignore

gazelle:
	bazel run //:gazelle -- update-repos -from_file="data-service/go.mod" -to_macro=repositories.bzl%go_repositories -prune
