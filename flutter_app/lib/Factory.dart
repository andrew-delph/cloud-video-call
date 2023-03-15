import 'package:flutter_webrtc/flutter_webrtc.dart' as webrtc;

final Map<String, dynamic> rtcConfiguration = {
  "sdpSemantics": "plan-b",
  "iceServers": [
    {
      "urls": [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
      ],
    },
    {
      "urls": ["turn:relay.metered.ca:80"],
      "username": "db5611baf2f55446ccb6a207",
      "credential": "95Cmq0CBYp6WiHDA",
    },
  ],
  "iceCandidatePoolSize": 10,
};

final Map<String, dynamic> offerSdpConstraints = {
  "mandatory": {
    "OfferToReceiveAudio": true,
    "OfferToReceiveVideo": true,
  },
  "optional": [],
};

class Factory {
  static Future<webrtc.RTCPeerConnection> createPeerConnection() async {
    webrtc.RTCPeerConnection peerConnection = await webrtc.createPeerConnection(
        rtcConfiguration, offerSdpConstraints);
    return peerConnection;
  }

  static String getHostAddress() {
    return const String.fromEnvironment('HOST_ADDRESS',
        defaultValue: 'localhost:8888');
  }

  static bool getHostSecure() {
    String secure =
        const String.fromEnvironment('HOST_SECURE', defaultValue: "false");
    return secure.toLowerCase() == 'true';
  }
}
