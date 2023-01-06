import 'package:flutter/cupertino.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

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

  io.Socket? socket;

  @override
  @mustCallSuper
  Future<void> dispose() async {
    super.dispose();
    await _localMediaStream?.dispose();
    await _remoteMediaStream?.dispose();
    await _peerConnection?.close();
  }

  Future<void> init() async{
    if(socket == null) initSocket();
  }

  Future<void> initSocket() async {
    const SOCKET_ADDRESS = String.fromEnvironment('SOCKET_ADDRESS',
        defaultValue: 'http://localhost:4000');

    print("SOCKET_ADDRESS is " + SOCKET_ADDRESS);

    // only websocket works on windows
    socket = io.io(SOCKET_ADDRESS, <String, dynamic>{
      'transports': ['websocket'],
    });

    socket!.emit("message", "I am a client");

    socket!.onConnect((_) {
      print('connect');
      socket!.emit('message', 'test flutter');
    });
    socket!.on('message', (data) => print(data));
    socket!.onDisconnect((_) {
      print('disconnect');
    });
    socket!.onError((data) {
      print("error: "+data);
    });
  }

  Future<void> initLocalStream() async {
    await _localMediaStream?.dispose();

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


}
