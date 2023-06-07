colletion notes:

    extension:
    - real ip: 69.157.158.40
    - vpn ip: 140.228.24.173
    - proxy ip?: 5.172.194.122

    - hola to greece
    - post /icecanadate: blocked cors
    - post /upload: status 403
    - console.log: /icecanadate ERR_BLOCKED_BY_CLIENT
    - hard to connect
    - msg: "F19 hmu"
    - msg: "add me on"
    - msg: "Hi"


    proxy-vpn:
    # retest to get proxy ips

    - vpn ip: 140.228.24.208
    - real ip: 69.157.158.40
    - omegle says technical error

    proxy-real:
    # retest to get proxy ips

    - real ip: 67.69.76.169
    - omegle says technical error
    - when not technical error: got a chat msg but no video

    real:
    - real ip: 69.157.158.40
    - no vpn

analysis:

"serverIPAddress":

- extension: real ips. also shows proxy ip
- proxy-real: "[::1]"
- proxy-vpn: "[::1]"
- real: real ips

"\_blocked_proxy":"

- only on extension

"connection":

- only 1 on real
- many on others

/events:

- returns chat msgs. they are not over webrtc

# parse.py:

split()[2]:

- extension is tcp and udp
- proxy-real is only udp
- proxy-vpn is only udp
- real is tcp and udp

split()[4]:

- extension is tcp and udp
- proxy-real could be showing proxy ip
- proxy-vpn could be showing proxy ip
- real is [realip,localip,192.168.49.1]

relationships between [2,4]:

- real.. realip is using udp
- extension is likely not using local ice candidates since blocked by cors
