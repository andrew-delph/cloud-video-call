#!/bin/bash
set -e
sleep 2

function test_commands() {
    echo
    echo "--- test_commands ---"
    echo
    # echo .......
    # dig options.default

    nslookup options.default | grep 'Server:'

    echo "--curl--"
    curl -sS https://2ip.io
    curl -sS http://options.default/health
    
    # cat /etc/resolv.conf
    # # echo
    # ip addr
    # ping -c 4 10.244.2.111
    # ip link show eth0
    # curl --interface eth0 --max-time 10 -H "Host: options.default" http://10.107.5.46/health

    echo
    echo
}


test_commands


# echo "dns before"
# cat /etc/resolv.conf
# # resolv_conf=$(cat /etc/resolv.conf)
# # echo "nameserver 8.8.8.8" >> /etc/resolv.conf
# # echo "$resolv_conf" >> /etc/resolv.conf
# echo "" > /etc/resolv.conf
# # echo "nameserver 8.8.8.8"" >> /etc/resolv.conf
# echo "nameserver 10.96.0.10" >> /etc/resolv.conf
# echo "search bot.svc.cluster.local svc.cluster.local cluster.local home" >> /etc/resolv.conf
# echo "options ndots:5" >> /etc/resolv.conf
# echo
# echo "dns after"
# cat /etc/resolv.conf

# echo "dns before"
# cat /etc/resolv.conf
# resolv_conf=$(cat /etc/resolv.conf)
# echo "nameserver 8.8.8.8" > /etc/resolv.conf
# echo "$resolv_conf" >> /etc/resolv.conf
# echo "dns after"
# cat /etc/resolv.conf


mkdir -p /dev/net 
mknod /dev/net/tun c 10 200 
chmod 600 /dev/net/tun

test_commands

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

# echo "route-nopull" >> $random_opvn
echo "auth-user-pass '/pia-openvpn/auth-user-pass.txt'" >> $random_opvn
# echo "route 10.96.0.0 255.255.0.0 net_gateway" >> $random_opvn
echo "route 10.96.0.0 255.240.0.0 net_gateway" >> $random_opvn


openvpn --config $random_opvn >/dev/null 2>&1 &

counter=0
while true; do
    # Check if the maximum wait time of 20 seconds has been reached
    if [ $counter -ge 20 ]; then
        echo "VPN connection timed out after 20 seconds."
        exit 1
    fi
    
    # ip addr show tun0 || echo .
    if ip addr show tun0 | grep -q "UP"; then
        echo "VPN is connected"
        break
    else
        # echo "VPN is not yet connected. Retrying in 1 second."
        sleep 1
        counter=$((counter + 1))
    fi
done

test_commands

# echo exiting...
# exit 1

/hola-proxy -bind-address 0.0.0.0:8080 -proxy-type peer &

echo "started proxy"

counter=0
while true; do
    # Check if the maximum wait time of 20 seconds has been reached
    if [ $counter -ge 20 ]; then
        echo "Proxy connection timed out after 20 seconds."
        exit 1
    fi
    if nc -z "localhost" "8080"; then
        echo "Proxy is ready"
        break
    else
        # echo "Proxy is not yet ready. Retrying in 1 second."
        sleep 1
        counter=$((counter + 1))
    fi
done

if [ ! -v RUN_COMMAND ] || [ -v PROXY ]; then
    echo "RUN_COMMAND=$RUN_COMMAND PROXY=$PROXY";
    while true; do sleep 10; done
else
    echo "RUN_COMMAND IS $RUN_COMMAND";
    mkdir -p screenshots
    bash $RUN_COMMAND
fi
