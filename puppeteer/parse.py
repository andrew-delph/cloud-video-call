import urllib.parse
import json



def unquote_candidate(string):
    # string = "id=shard5%3Abro2f1k0mt8a8vjkvqafux0ph09nu4&candidate=%7B%22candidate%22%3A%22candidate%3A1320428893%201%20udp%201686052607%2069.157.158.40%2036483%20typ%20srflx%20raddr%20192.168.49.1%20rport%2036483%20generation%200%20ufrag%20N%2B%2BI%20network-id%201%22%2C%22sdpMid%22%3A%220%22%2C%22sdpMLineIndex%22%3A0%2C%22usernameFragment%22%3A%22N%2B%2BI%22%7D&candidate=%7B%22candidate%22%3A%22candidate%3A2298788390%201%20udp%201685987071%2069.157.158.40%2051005%20typ%20srflx%20raddr%20192.168.1.11%20rport%2051005%20generation%200%20ufrag%20N%2B%2BI%20network-id%202%20network-cost%2010%22%2C%22sdpMid%22%3A%221%22%2C%22sdpMLineIndex%22%3A1%2C%22usernameFragment%22%3A%22N%2B%2BI%22%7D&candidate=%7B%22candidate%22%3A%22candidate%3A2298788390%201%20udp%201685987071%2069.157.158.40%2047285%20typ%20srflx%20raddr%20192.168.1.11%20rport%2047285%20generation%200%20ufrag%20N%2B%2BI%20network-id%202%20network-cost%2010%22%2C%22sdpMid%22%3A%220%22%2C%22sdpMLineIndex%22%3A0%2C%22usernameFragment%22%3A%22N%2B%2BI%22%7D&candidate=%7B%22candidate%22%3A%22candidate%3A1320428893%201%20udp%201686052607%2069.157.158.40%2050442%20typ%20srflx%20raddr%20192.168.49.1%20rport%2050442%20generation%200%20ufrag%20N%2B%2BI%20network-id%201%22%2C%22sdpMid%22%3A%221%22%2C%22sdpMLineIndex%22%3A1%2C%22usernameFragment%22%3A%22N%2B%2BI%22%7D"
    
    # Split the string by '&' to get individual key-value pairs
    pairs = string.split('&')

    # Create a dictionary to store the parsed values
    unquote_map = {}

    if(len(pairs)>1):
        print("pairs", len(pairs))
        for pair in pairs:
            # Split each pair by '=' to separate the key and value
            key, value = pair.split('=')

            # URL decode the value
            decoded_value = urllib.parse.unquote(value)

            # Store the key-value pair in the dictionary
            unquote_map[key] = decoded_value
        return json.loads(unquote_map['candidate'])['candidate']
    else:
        return json.loads(urllib.parse.unquote(string))['candidate']


def parse_candidates(file_name):

    # Open the JSON file
    with open(file_name) as file:
        # Load the JSON data
        data = json.load(file)

    # Find all occurrences of "expires" field and extract its value
    candidates = []
        
    def find_expires(json_obj):
        if isinstance(json_obj, dict):
            for key, value in json_obj.items():
                if value == "candidate" and key == "name" and "value" in json_obj:
                    candidates.append(unquote_candidate(json_obj["value"]))
                elif isinstance(value, (dict, list)):
                    find_expires(value)
        elif isinstance(json_obj, list):
            for item in json_obj:
                find_expires(item)

    # Call the function to find all "expires" values in the JSON data
    find_expires(data)

    # Print the extracted "expires" values
    return candidates

# test = "v=0\r\no=- 2175512719439285923 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS 68a2619c-6d93-4efb-8b39-ebb223a55525\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 110 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:1Y68\r\na=ice-pwd:wmQnP41VTvNHAbsQL5TZnJnq\r\na=ice-options:trickle\r\na=fingerprint:sha-256 0A:72:62:D4:57:19:06:87:56:0D:7F:97:73:66:30:FB:EB:28:44:9E:71:CB:15:F6:15:45:E4:FA:C1:57:40:B4\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=sendrecv\r\na=msid:68a2619c-6d93-4efb-8b39-ebb223a55525 f2fe4fd8-a7aa-4f7c-8eb7-cff734a42715\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:9 G722/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:2338138468 cname:eB15CRrNLJko12JV\r\na=ssrc:2338138468 msid:68a2619c-6d93-4efb-8b39-ebb223a55525 f2fe4fd8-a7aa-4f7c-8eb7-cff734a42715\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 102 103 104 105 106 107 108 109 127 125 39 40 45 46 98 99 100 101 112 113 114\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:1Y68\r\na=ice-pwd:wmQnP41VTvNHAbsQL5TZnJnq\r\na=ice-options:trickle\r\na=fingerprint:sha-256 0A:72:62:D4:57:19:06:87:56:0D:7F:97:73:66:30:FB:EB:28:44:9E:71:CB:15:F6:15:45:E4:FA:C1:57:40:B4\r\na=setup:actpass\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendrecv\r\na=msid:68a2619c-6d93-4efb-8b39-ebb223a55525 5957c779-d921-4b62-9f24-5eedf85df1a7\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:103 rtx/90000\r\na=fmtp:103 apt=102\r\na=rtpmap:104 H264/90000\r\na=rtcp-fb:104 goog-remb\r\na=rtcp-fb:104 transport-cc\r\na=rtcp-fb:104 ccm fir\r\na=rtcp-fb:104 nack\r\na=rtcp-fb:104 nack pli\r\na=fmtp:104 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\na=rtpmap:105 rtx/90000\r\na=fmtp:105 apt=104\r\na=rtpmap:106 H264/90000\r\na=rtcp-fb:106 goog-remb\r\na=rtcp-fb:106 transport-cc\r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack\r\na=rtcp-fb:106 nack pli\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=106\r\na=rtpmap:108 H264/90000\r\na=rtcp-fb:108 goog-remb\r\na=rtcp-fb:108 transport-cc\r\na=rtcp-fb:108 ccm fir\r\na=rtcp-fb:108 nack\r\na=rtcp-fb:108 nack pli\r\na=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\na=rtpmap:109 rtx/90000\r\na=fmtp:109 apt=108\r\na=rtpmap:127 H264/90000\r\na=rtcp-fb:127 goog-remb\r\na=rtcp-fb:127 transport-cc\r\na=rtcp-fb:127 ccm fir\r\na=rtcp-fb:127 nack\r\na=rtcp-fb:127 nack pli\r\na=fmtp:127 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\na=rtpmap:125 rtx/90000\r\na=fmtp:125 apt=127\r\na=rtpmap:39 H264/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:45 AV1/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:112 red/90000\r\na=rtpmap:113 rtx/90000\r\na=fmtp:113 apt=112\r\na=rtpmap:114 ulpfec/90000\r\na=ssrc-group:FID 1425393876 508898610\r\na=ssrc:1425393876 cname:eB15CRrNLJko12JV\r\na=ssrc:1425393876 msid:68a2619c-6d93-4efb-8b39-ebb223a55525 5957c779-d921-4b62-9f24-5eedf85df1a7\r\na=ssrc:508898610 cname:eB15CRrNLJko12JV\r\na=ssrc:508898610 msid:68a2619c-6d93-4efb-8b39-ebb223a55525 5957c779-d921-4b62-9f24-5eedf85df1a7\r\n"
# values = test.split()

# for v in values:
#     print(v)

# exit()


candidates = []
# candidates = candidates + parse_candidates('/home/andrew/git/omegle-scripts/tests/test1/extension.har')

# candidates = candidates + parse_candidates('/home/andrew/git/omegle-scripts/tests/test1/proxy-vpn.har')
candidates = candidates + parse_candidates('/home/andrew/git/omegle-scripts/tests/test1/real.har')


# candidates = candidates + parse_candidates('/home/andrew/git/omegle-scripts/tests/test1/proxy-real.har')

# print(candidates)

for c in candidates:
    print(c)
    # if c.split()[2] != "udp":
    #     continue
    # print(c.split()[2], c.split()[4], c.split()[7], c.split()[8], c.split()[9], c.split()[10], c.split()[11])

print(len(candidates))