format:
	find . -type d -name 'node_modules' -prune -o -type f -name '.gitignore' -exec sh -c 'echo "### {} ###"; sed "s|^./|$(dirname {})/|" {}' \; > .prettierignore
	npx prettier --ignore-path .prettierignore --write  .
