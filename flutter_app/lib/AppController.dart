import 'package:flutter/cupertino.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class AppProvider extends ChangeNotifier {
  late MediaStream _localMediaStream;
  late MediaStream _remoteMediaStream;
  late RTCPeerConnection _peerConnection;

  RTCVideoRenderer _localVideoRenderer = RTCVideoRenderer();
  RTCVideoRenderer _remoteVideoRenderer = RTCVideoRenderer();

  RTCVideoRenderer get remoteVideoRenderer => _remoteVideoRenderer;

  RTCVideoRenderer get localVideoRenderer => _localVideoRenderer;

  AppProvider() {
    // initLocal();
  }

  Future<void> initLocal() async {
    // final myVideo = RTCVideoRenderer();
    // await myVideo.initialize();
    //
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true
    };

    MediaStream stream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);

    localMediaStream = stream;
    // myVideo.srcObject = stream;
    //
    // localVideoRenderer = myVideo;
  }

  MediaStream get localMediaStream {
    print("get localMediaStream");
    return _localMediaStream;
  }

  set localMediaStream(MediaStream value) {
    print("set localMediaStream");
    _localMediaStream = value;

    localVideoRenderer.initialize();

    localVideoRenderer.srcObject = _localMediaStream;
  }

  RTCPeerConnection get peerConnection => _peerConnection;

  set peerConnection(RTCPeerConnection value) {
    _peerConnection = value;
    notifyListeners();
  }

  MediaStream get remoteMediaStream => _remoteMediaStream;

  set remoteMediaStream(MediaStream value) {
    _remoteMediaStream = value;

    remoteVideoRenderer.initialize();

    remoteVideoRenderer.srcObject = _localMediaStream;
  }
}
