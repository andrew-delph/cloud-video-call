import 'dart:convert';

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

  Future<void> ready() async {
    print("peerConnection");
    print(peerConnection);

    await peerConnection?.close();
    await resetRemoteMediaStream();
    socket!.off("client_host");
    socket!.off("client_guest");
    socket!.off("set_client_host");
    socket!.off("set_client_guest");

    socket!.emit("ready");
    socket!.on("set_client_host", (value) async {
      await setClientHost(value);
    });

    socket!.on("set_client_guest", (value) async {
      await setClientGuest(value);
    });
  }

  Future<void> setClientHost(value) async {
    print("you are the host");

    peerConnection = await Factory.createPeerConnection();

    localMediaStream!.getTracks().forEach((track) async {
      await peerConnection!.addTrack(track, localMediaStream!);
    });

    peerConnection!.onIceCandidate = (event) {
      socket!.emit(
          "client_host",
          jsonEncode({
            "icecandidate": {
              'candidate': event.candidate,
              'sdpMid': event.sdpMid,
              'sdpMlineIndex': event.sdpMLineIndex
            }
          }));
    };

    // collect the streams/tracks from remote
    peerConnection!.onAddStream = (stream) {};
    peerConnection!.onAddTrack = (stream, track) async {
      await addRemoteTrack(track);
    };
    peerConnection!.onTrack = (RTCTrackEvent track) async {
      await addRemoteTrack(track.track);
    };

    RTCSessionDescription offerDescription =
        await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(offerDescription);

    // send the offer
    socket!.emit(
        "client_host",
        jsonEncode({
          "offer": {
            "type": offerDescription.type,
            "sdp": offerDescription.sdp,
          },
        }));

    socket!.on("client_host", (data) {
      data = jsonDecode(data);

      if (data['answer'] != null) {
        print("got answer");
        RTCSessionDescription answerDescription = RTCSessionDescription(
            data['answer']["sdp"], data['answer']["type"]);
        peerConnection!.setRemoteDescription(answerDescription);
      }

      // Listen for remote ICE candidates below
      if (data["icecandidate"] != null) {
        RTCIceCandidate iceCandidate = RTCIceCandidate(
            data["icecandidate"]['candidate'],
            data["icecandidate"]['sdpMid'],
            data["icecandidate"]['sdpMlineIndex']);
        peerConnection!.addCandidate(iceCandidate);
      }
    });
  }

  Future<void> setClientGuest(value) async {
    print("you are the guest");

    peerConnection = await Factory.createPeerConnection();

    localMediaStream!.getTracks().forEach((track) async {
      await peerConnection!.addTrack(track, localMediaStream!);
    });

    peerConnection!.onIceCandidate = (event) {
      socket!.emit(
          "client_guest",
          jsonEncode({
            "icecandidate": {
              'candidate': event.candidate,
              'sdpMid': event.sdpMid,
              'sdpMlineIndex': event.sdpMLineIndex
            }
          }));
    };

    // collect the streams/tracks from remote
    peerConnection!.onAddStream = (stream) {};
    peerConnection!.onAddTrack = (stream, track) async {
      await addRemoteTrack(track);
    };
    peerConnection!.onTrack = (RTCTrackEvent track) async {
      await addRemoteTrack(track.track);
    };

    socket!.on("client_guest", (data) async {
      data = jsonDecode(data);

      if (data["offer"] != null) {
        await peerConnection!.setRemoteDescription(
            RTCSessionDescription(data["offer"]["sdp"], data["offer"]["type"]));

        RTCSessionDescription answerDescription =
            await peerConnection!.createAnswer();

        await peerConnection!.setLocalDescription(answerDescription);

        // send the offer
        socket!.emit(
            "client_guest",
            jsonEncode({
              "answer": {
                "type": answerDescription.type,
                "sdp": answerDescription.sdp,
              },
            }));
      }

      // Listen for remote ICE candidates below
      if (data["icecandidate"] != null) {
        RTCIceCandidate iceCandidate = RTCIceCandidate(
            data["icecandidate"]['candidate'],
            data["icecandidate"]['sdpMid'],
            data["icecandidate"]['sdpMlineIndex']);
        peerConnection!.addCandidate(iceCandidate);
      }
    });
  }

  Future<void> addRemoteTrack(MediaStreamTrack track) async {
    await remoteMediaStream!.addTrack(track);
    notifyListeners(); // todo remove
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
