// Package imports:
import 'package:flutter_webrtc/flutter_webrtc.dart' as webrtc;

final Map<String, dynamic> offerSdpConstraints = {
  "mandatory": {
    "OfferToReceiveAudio": true,
    "OfferToReceiveVideo": true,
  },
  "optional": [],
};

class Factory {
  static Future<webrtc.RTCPeerConnection> createPeerConnection() async {
    webrtc.RTCPeerConnection peerConnection =
        await webrtc.createPeerConnection({}, offerSdpConstraints);
    return peerConnection;
  }

  static String getWsHost() {
    return const String.fromEnvironment('WS_HOST',
        defaultValue: 'https://ws.andrewdelph.com');
  }

  static String getOptionsHost() {
    return const String.fromEnvironment('OPTIONS_HOST',
        defaultValue: 'https://options.andrewdelph.com');
  }

  static dynamic getRtcConfiguration(List iceServers) {
    /*
    It seems there are issues using plan-b and vpns for mobile.
    */
    return {
      "sdpSemantics": "unified-plan", //"plan-b",
      "iceServers": iceServers,
      // "iceCandidatePoolSize": 10,
    };
  }
}
