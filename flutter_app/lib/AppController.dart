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

  }

  MediaStream get localMediaStream {
    return _localMediaStream;
  }

  set localMediaStream(MediaStream value) {
    _localMediaStream = value;

    localVideoRenderer.initialize().then((value) {
      print("init done");

      localVideoRenderer.srcObject = _localMediaStream;
    });
  }

  RTCPeerConnection get peerConnection => _peerConnection;

  set peerConnection(RTCPeerConnection value) {
    _peerConnection = value;
    notifyListeners();
  }

  MediaStream get remoteMediaStream => _remoteMediaStream;

  set remoteMediaStream(MediaStream value) {
    _remoteMediaStream = value;

    remoteVideoRenderer.initialize().then((value) {
      remoteVideoRenderer.srcObject = _remoteMediaStream;
    });
  }
}
