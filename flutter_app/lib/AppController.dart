import 'package:flutter/cupertino.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class AppController extends ChangeNotifier {
  RTCVideoRenderer _localVideoRenderer = RTCVideoRenderer();
  RTCVideoRenderer _remoteVideoRenderer = RTCVideoRenderer();

  AppController() {
    initLocal();
  }

  void initLocal() async {
    final myVideo = RTCVideoRenderer();
    await myVideo.initialize();

    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true
    };
    MediaStream stream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);
    myVideo.srcObject = stream;

    localVideoRenderer = myVideo;
  }

  set localVideoRenderer(value) {
    value.initialize();
    _localVideoRenderer = value;
    notifyListeners();
  }

  set remoteVideoRenderer(value) {
    value.initialize();
    _remoteVideoRenderer = value;
    notifyListeners();
  }

  RTCVideoRenderer get remoteVideoRenderer => _remoteVideoRenderer;
  RTCVideoRenderer get localVideoRenderer => _localVideoRenderer;
}
