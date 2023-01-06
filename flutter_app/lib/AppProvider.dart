import 'package:flutter/cupertino.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'Factory.dart';

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

  Future<void> init() async {
    if (socket == null) initSocket();
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
      print("error: " + data);
    });
  }

  Future<void> initLocalStream() async {
    if (_localMediaStream != null) return;
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
    notifyListeners();
  }

  Future<void> ready() async {
    print("peerConnection");
    print(peerConnection);

    await resetRemoteMediaStream();
    socket!.off("client_host");
    socket!.off("client_guest");
    socket!.off("set_client_host");
    socket!.off("set_client_guest");
    socket!.off("icecandidate");

    // START SETUP PEER CONNECTION
    await peerConnection?.close();
    peerConnection = await Factory.createPeerConnection();
    // END SETUP PEER CONNECTION

    // START add localMediaStream to peerConnection
    localMediaStream!.getTracks().forEach((track) async {
      await peerConnection!.addTrack(track, localMediaStream!);
    });
    // START add localMediaStream to peerConnection

    // START collect the streams/tracks from remote
    peerConnection!.onAddStream = (stream) {
      print("onAddStream");
      remoteMediaStream = stream;
    };
    peerConnection!.onAddTrack = (stream, track) async {
      print("onAddTrack");
      stream.getTracks().forEach((element) {
        print(element);
      });
      await addRemoteTrack(track);
    };
    peerConnection!.onTrack = (RTCTrackEvent track) async {
      print("onTrack");
      await addRemoteTrack(track.track);
    };
    // END collect the streams/tracks from remote

    socket!.on("set_client_host", (value) async {
      await setClientHost(value);
    });

    socket!.on("set_client_guest", (value) async {
      await setClientGuest(value);
    });

    // START HANDLE ICE CANDIDATES
    peerConnection!.onIceCandidate = (event) {
      socket!.emit("icecandidate", {
        "icecandidate": {
          'candidate': event.candidate,
          'sdpMid': event.sdpMid,
          'sdpMlineIndex': event.sdpMLineIndex
        }
      });
    };
    socket!.on("icecandidate", (data) async {
      print("got ice!");
      RTCIceCandidate iceCandidate = RTCIceCandidate(
          data["icecandidate"]['candidate'],
          data["icecandidate"]['sdpMid'],
          data["icecandidate"]['sdpMlineIndex']);
      peerConnection!.addCandidate(iceCandidate);
    });
    // END HANDLE ICE CANDIDATES

    socket!.emit("ready");
  }

  Future<void> setClientHost(value) async {
    print("you are the host");

    RTCSessionDescription offerDescription =
        await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(offerDescription);

    // send the offer
    socket!.emit("client_host", {
      "offer": {
        "type": offerDescription.type,
        "sdp": offerDescription.sdp,
      },
    });

    socket!.on("client_host", (data) {
      if (data['answer'] != null) {
        print("got answer");
        RTCSessionDescription answerDescription = RTCSessionDescription(
            data['answer']["sdp"], data['answer']["type"]);
        peerConnection!.setRemoteDescription(answerDescription);
      }
    });
  }

  Future<void> setClientGuest(value) async {
    print("you are the guest");

    socket!.on("client_guest", (data) async {
      if (data["offer"] != null) {
        print("got offer");
        await peerConnection!.setRemoteDescription(
            RTCSessionDescription(data["offer"]["sdp"], data["offer"]["type"]));

        RTCSessionDescription answerDescription =
            await peerConnection!.createAnswer();

        await peerConnection!.setLocalDescription(answerDescription);

        // send the offer
        socket!.emit("client_guest", {
          "answer": {
            "type": answerDescription.type,
            "sdp": answerDescription.sdp,
          },
        });
      }
    });
  }

  Future<void> addRemoteTrack(MediaStreamTrack track) async {
    await remoteMediaStream!.addTrack(track);
    remoteVideoRenderer.initialize().then((value) {
      remoteVideoRenderer.srcObject = _remoteMediaStream;
      notifyListeners();
    });
  }

  Future<void> resetRemoteMediaStream() async {
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
