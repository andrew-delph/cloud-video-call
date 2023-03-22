import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:statemachine/statemachine.dart';

import 'Factory.dart';

enum SocketConnectionState { connected, connectionError, error, disconnected }

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
  String? feedbackId;
  bool established = false;

  // late Machine<String> stateMachine;

  Machine<SocketStates> socketMachine = getSocketMachine();
  Machine<ChatStates> chatMachine = getChatMachine();

  AppProvider() {
    socketMachine[SocketStates.established].addNested(chatMachine);
    stateChangeOnEntry(socketMachine, () {
      notifyListeners();
    });
    stateChangeOnEntry(chatMachine, () {
      notifyListeners();
    });

    socketMachine[SocketStates.connecting].onEntry(() async {
      await initSocket();
    });

    chatMachine[ChatStates.matched].onTimeout(const Duration(seconds: 10), () {
      chatMachine.current = ChatStates.connectionError;
    });

    chatMachine[ChatStates.ended].onEntry(() async {
      if (socket != null && socket?.connected == true) {
        socket!.emit("endchat", "endchat");
      }
      await tryResetRemote();
      chatMachine.current = ChatStates.feedback;
    });

    socketMachine.start();
  }

  Function(SocketConnectionState, dynamic)? onSocketStateChange;
  Function(RTCPeerConnectionState)? onPeerConnectionStateChange;

  int activeCount = 0;

  @override
  @mustCallSuper
  Future<void> dispose() async {
    super.dispose();
    await _localMediaStream?.dispose();
    await _remoteMediaStream?.dispose();
    await _peerConnection?.close();
  }

  Future<void> init(
      {Function(SocketConnectionState, dynamic)? onSocketStateChange,
      Function(RTCPeerConnectionState)? onPeerConnectionStateChange}) async {
    this.onSocketStateChange = onSocketStateChange;
    this.onPeerConnectionStateChange = onPeerConnectionStateChange;
  }

  void handleSocketStateChange(
      SocketConnectionState socketState, dynamic details) {
    if (onSocketStateChange != null) onSocketStateChange!(socketState, details);
  }

  void handlePeerConnectionStateChange(
      RTCPeerConnectionState peerConnectionState) {
    if (onPeerConnectionStateChange != null) {
      onPeerConnectionStateChange!(peerConnectionState);
    }
  }

  Future<void> initSocket() async {
    String socketAddress = Factory.getWsHost();

    print("SOCKET_ADDRESS is $socketAddress");

    // only websocket works on windows
    socket = io.io(
        socketAddress,
        OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setAuth(
                {"auth": await FirebaseAuth.instance.currentUser?.getIdToken()})
            .build());

    socket!.emit("message", "I am a client");

    socket!.on("myping", (request) async {
      List data = request as List;
      String value = data[0] as String;
      Function callback = data[1] as Function;

      callback("flutter responded");
    });

    socket!.emitWithAck("myping", "I am a client",
        ack: (data) => print("ping ack"));

    socket!.onConnectError((details) {
      print('connectError $details');
      handleSocketStateChange(SocketConnectionState.connectionError, details);
      notifyListeners();
    });

    socket!.on('activeCount', (data) {
      activeCount = int.tryParse(data.toString()) ?? -1;
      notifyListeners();
    });

    socket!.on('established', (data) {
      established = true;
      socketMachine.current = SocketStates.established;
      notifyListeners();
    });

    socket!.onConnect((_) {
      socketMachine.current = SocketStates.connected;
      socket!.emit('message', 'from flutter app connected');
      notifyListeners();
    });

    socket!.on('message', (data) => print(data));
    socket!.on('endchat', (data) async {
      print("got endchat event");
      chatMachine.current = ChatStates.ended;
    });
    socket!.onDisconnect((details) {
      socketMachine.current = SocketStates.connecting;
      established = false;
      handleSocketStateChange(SocketConnectionState.disconnected, details);
      notifyListeners();
    });
    socket!.on('error', (data) {
      print("error $data");
      handleSocketStateChange(SocketConnectionState.error, data);
      notifyListeners();
    });

    try {
      socket!.connect();
    } catch (error) {
      print("error...$error");
    }
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

  Future<void> tryResetRemote() async {
    if (peerConnection != null) {
      await peerConnection?.close();
    }
    await resetRemoteMediaStream();
  }

  Future<void> ready() async {
    chatMachine.current = ChatStates.ready;
    await tryResetRemote();
    await initLocalStream();
    socket!.off("client_host");
    socket!.off("client_guest");
    socket!.off("match");
    socket!.off("icecandidate");

    // START SETUP PEER CONNECTION
    peerConnection = await Factory.createPeerConnection();
    peerConnection?.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        chatMachine.current = ChatStates.connected;
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        chatMachine.current = ChatStates.ended;
      }
      // print("peerConnection changed state: $state");
      handlePeerConnectionStateChange(state);
      notifyListeners();
    };
    // END SETUP PEER CONNECTION

    // START add localMediaStream to peerConnection
    localMediaStream!.getTracks().forEach((track) async {
          await peerConnection!.addTrack(track, localMediaStream!);
    });

    // START add localMediaStream to peerConnection

    // START collect the streams/tracks from remote
    peerConnection!.onAddStream = (stream) {
      // print("onAddStream");
      remoteMediaStream = stream;
    };
    peerConnection!.onAddTrack = (stream, track) async {
      // print("onAddTrack");
      await addRemoteTrack(track);
    };
    peerConnection!.onTrack = (RTCTrackEvent track) async {
      // print("onTrack");
      await addRemoteTrack(track.track);
    };
    // END collect the streams/tracks from remote

    socket!.on("match", (request) async {
      chatMachine.current = ChatStates.matched;
      List data = request as List;
      dynamic value = data[0] as dynamic;
      Function callback = data[1] as Function;
      String? role = value["role"];
      feedbackId = value["feedback_id"];
      print("feedback_id: $feedbackId");
      if (feedbackId == null) {
        chatMachine.current = ChatStates.matchedError;
        return;
      }
      switch (role) {
        case "host":
          {
            await setClientHost();
          }
          break;
        case "guest":
          {
            await setClientGuest();
          }
          break;
        default:
          {
            chatMachine.current = ChatStates.matchedError;
            print("role is not host/guest: $role");
          }
          break;
      }
      callback(null);
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
      // print("got ice!");
      RTCIceCandidate iceCandidate = RTCIceCandidate(
          data["icecandidate"]['candidate'],
          data["icecandidate"]['sdpMid'],
          data["icecandidate"]['sdpMlineIndex']);
      peerConnection!.addCandidate(iceCandidate);
    });
    // END HANDLE ICE CANDIDATES

    socket!.emitWithAck("ready", {}, ack: (data) => print("ready ack"));
  }

  Future<void> setClientHost() async {
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
        // print("got answer");
        RTCSessionDescription answerDescription = RTCSessionDescription(
            data['answer']["sdp"], data['answer']["type"]);
        peerConnection!.setRemoteDescription(answerDescription);
      }
    });
  }

  Future<void> setClientGuest() async {
    print("you are the guest");

    socket!.on("client_guest", (data) async {
      if (data["offer"] != null) {
        // print("got offer");
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

      // TODO open pr or issue on https://github.com/flutter-webrtc/flutter-webrtc
      // you cannot create a MediaStream
      if (WebRTC.platformIsWeb) {
        _remoteVideoRenderer!.muted = false;
        print(" (WebRTC.platformIsWeb_remoteVideoRenderer!.muted = false;");
      }

      notifyListeners();
    });
  }

  Future<void> resetRemoteMediaStream() async {
    remoteMediaStream = await createLocalMediaStream("remote");
    notifyListeners();
  }

  Future<void> changeCamera(MediaDeviceInfo mediaDeviceInfo) async {
    MediaStreamTrack videoTrack = localMediaStream!.getVideoTracks()[0];
    await Helper.switchCamera(
        videoTrack, mediaDeviceInfo.deviceId, localMediaStream);

    MediaStreamTrack newVideoTrack = localMediaStream!.getVideoTracks()[0];

    (await peerConnection?.senders)?.forEach((element) {
      print("element.track.kind ${element.track?.kind}");
      if (element.track?.kind == 'video') {
        print("replacing video...");
        element.replaceTrack(newVideoTrack);
      }
    });
    localVideoRenderer.initialize().then((value) {
      localVideoRenderer.srcObject = _localMediaStream;
      notifyListeners();
    });
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
