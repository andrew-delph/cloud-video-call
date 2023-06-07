#!/bin/bash
set -e

echo "dns before"
cat /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "dns after"
cat /etc/resolv.conf

mkdir -p /dev/net 
mknod /dev/net/tun c 10 200 
chmod 600 /dev/net/tun

curl -sS https://2ip.io

echo "starting openvpn"


# Get a list of files with the .test extension in the test directory
files=(/pia-openvpn/*.ovpn)

# Check if there are any .test files in the directory
if [ ${#files[@]} -eq 0 ]; then
  echo "No .ovpn files found."
  exit 1
fi
random_index=$(( RANDOM % ${#files[@]} ))

random_opvn=${files[random_index]}

echo "Randomly selected file: $random_opvn"

echo "auth-user-pass '/pia-openvpn/auth-user-pass.txt'" >> $random_opvn

openvpn --config $random_opvn &

counter=0
while true; do
    # Check if the maximum wait time of 20 seconds has been reached
    if [ $counter -ge 4 ]; then
        echo "VPN connection timed out after 20 seconds."
        break
    fi
    
    # ip addr show tun0 || echo .
    if ip addr show tun0 | grep -q "UP"; then
        echo "VPN is connected"
        break
    else
        echo "VPN is not yet connected. Retrying in 5 seconds..."
        sleep 5
        counter=$((counter + 1))
    fi
done


# nslookup google.com

curl -sS https://2ip.io

echo "starting proxy PROXY=$PROXY"

if [ -n "$PROXY" ]; then
  /proxy/hola-proxy -bind-address 0.0.0.0:8080 -proxy-type peer
  exit
fi

/proxy/hola-proxy -bind-address 0.0.0.0:8080 -proxy-type peer >/dev/null 2>&1 &

echo "started proxy"

counter=0
while true; do
    # Check if the maximum wait time of 20 seconds has been reached
    if [ $counter -ge 4 ]; then
        echo "VPN connection timed out after 20 seconds."
        break
    fi
    if nc -z "localhost" "8080"; then
        echo "Proxy is ready"
        break
    else
        echo "Proxy is not yet ready. Retrying in 5 seconds..."
        sleep 5
        counter=$((counter + 1))
    fi
done

mkdir -p screenshots

node /app/dist/browser.js