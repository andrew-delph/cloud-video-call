pods=$(kubectl get pods -n bot -l app=puppeteer --output=jsonpath='{range .items[*]}{.metadata.name}{" "}{end}')
while IFS=' ' read -ra podArray; do
  for pod in "${podArray[@]}"; do
    local_port=$(( 8080 + RANDOM % 1000 )) # Generate a random local port
    kubectl port-forward -n bot pod/"$pod" "$local_port":80 &
    sleep 2 # Add a delay to ensure port-forwarding is established
    # Open browser for the pod's /health endpoint
    curl "http://localhost:$local_port/health" | echo failed curl
    # open "http://localhost:$local_port/health" 2>/dev/null || echo "Browser not found. Manually open http://localhost:$local_port/health"
  done
done <<< "$pods"