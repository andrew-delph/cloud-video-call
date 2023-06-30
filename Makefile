format:
	find . -type d -name 'node_modules' -prune -o -type f -name '.gitignore' -exec sh -c 'echo "### {} ###"; sed "s|^./|$(dirname {})/|" {}' \; > .prettierignore
	prettier --ignore-path .prettierignore --write  .
	(cd flutter_app && make format)
