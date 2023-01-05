import 'package:flutter/cupertino.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class AppProvider extends ChangeNotifier {
  MediaStream? _localMediaStream;
  MediaStream? _remoteMediaStream;
  RTCPeerConnection? _peerConnection;
  RTCVideoRenderer _localVideoRenderer = RTCVideoRenderer();
  RTCVideoRenderer _remoteVideoRenderer = RTCVideoRenderer();

  MediaStream? get localMediaStream => _localMediaStream;
  MediaStream? get remoteMediaStream => _remoteMediaStream;
  RTCPeerConnection? get peerConnection => _peerConnection;

  RTCVideoRenderer get remoteVideoRenderer => _remoteVideoRenderer;
  RTCVideoRenderer get localVideoRenderer => _localVideoRenderer;


  set localMediaStream(MediaStream? value) {
    _localMediaStream = value;
    localVideoRenderer.initialize().then((value) {
      localVideoRenderer.srcObject = _localMediaStream;
      notifyListeners();
    });
  }

  set remoteMediaStream(MediaStream? value) {
    _remoteMediaStream = value;
    remoteVideoRenderer.initialize().then((value) {
      remoteVideoRenderer.srcObject = _remoteMediaStream;
      notifyListeners();
    });
  }


  set peerConnection(RTCPeerConnection? value) {
    _peerConnection = value;
    notifyListeners();
  }

  Future<void> close() async {
    await _localMediaStream?.dispose();
    await _localMediaStream?.dispose();
    await _peerConnection?.close();

  }

  Future<void> init() async {
    await close();

    _localVideoRenderer = RTCVideoRenderer();
    _remoteVideoRenderer = RTCVideoRenderer();

    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true
    };
    MediaStream stream =
    await navigator.mediaDevices.getUserMedia(mediaConstraints);

    localMediaStream = stream;
    remoteMediaStream = await createLocalMediaStream("remote");
    notifyListeners();
  }


  Future<void> addRemoteTrack(MediaStreamTrack track) async{
    await remoteMediaStream!.addTrack(track);
    notifyListeners(); // todo remove
    remoteVideoRenderer.initialize().then((value) {
      remoteVideoRenderer.srcObject = _remoteMediaStream;
      notifyListeners();
    });
  }

  Future<void> resetRemoteMediaStream() async{
    remoteMediaStream = await createLocalMediaStream("remote");
    notifyListeners();
  }
}
