import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_app/utils.dart';
import 'package:flutter_app/widgets/screens/ChatScreen.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:statemachine/statemachine.dart';
import 'package:http/http.dart' as http;

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

  io.Socket? socket;
  String? feedbackId;
  bool established = false;

  // late Machine<String> stateMachine;

  Machine<SocketStates> socketMachine = getSocketMachine();
  Machine<ChatStates> chatMachine = getChatMachine();

  Future<SharedPreferences> getPrefs() async {
    return await SharedPreferences.getInstance();
  }

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

    socketMachine[SocketStates.error].onTimeout(const Duration(seconds: 3), () {
      socketMachine.current = SocketStates.connecting;
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
  }

  void handleError(ErrorDetails errorDetails) {
    if (handleErrorCallback != null) {
      handleErrorCallback!(errorDetails);
    }
  }

  Function(ErrorDetails errorDetails)? handleErrorCallback;

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
      {Function(ErrorDetails details)? handleErrorCallback}) async {
    this.handleErrorCallback = handleErrorCallback;
    socketMachine.start();
  }

  Future<void> initSocket() async {
    established = false;
    String socketAddress = Factory.getWsHost();

    print("SOCKET_ADDRESS is $socketAddress ");

    // only websocket works on windows
    if (socket != null) {
      socket?.disconnect();
    }
    socket = io.io(
        socketAddress,
        OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .disableReconnection()
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
    });

    socket!.onConnectError((error) {
      print('connectError $error');

      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    });

    socket!.on('error', (error) {
      print("error $error");
      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    });

    try {
      socket!.connect();
    } catch (error) {
      print("error...$error");
      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    }
  }

  Future<void> initLocalStream() async {
    if (_localMediaStream != null) return;
    await _localMediaStream?.dispose();

    _localVideoRenderer = RTCVideoRenderer();
    _remoteVideoRenderer = RTCVideoRenderer();

    try {
      await setLocalMediaStream();
      notifyListeners();
    } catch (error) {
      handleError(ErrorDetails("initLocalStream", error.toString()));
    }
  }

  Future<void> tryResetRemote() async {
    if (peerConnection != null) {
      await peerConnection?.close();
    }
    await resetRemoteMediaStream();
  }

  Future<void> ready() async {
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

    socket!.emitWithAck("ready", {'ready': true}, ack: (data) {
      print("ready ack $data");
      chatMachine.current = ChatStates.ready;
    });
  }

  Future<void> unReady() async {
    socket!.emitWithAck("ready", {'ready': false}, ack: (data) {
      print("ready ack $data");
      chatMachine.current = ChatStates.waiting;
    });
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
        _remoteVideoRenderer.muted = false;
        print(" (WebRTC.platformIsWeb_remoteVideoRenderer!.muted = false;");
      }

      notifyListeners();
    });
  }

  Future<void> resetRemoteMediaStream() async {
    remoteMediaStream = await createLocalMediaStream("remote");
    notifyListeners();
  }

  Future<void> setLocalMediaStream() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true,
    };

    MediaStream mediaStream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);

    String? audioDeviceLabel = (await getPrefs()).getString('audioDeviceLabel');
    String? videoDeviceLabel = (await getPrefs()).getString('videoDeviceLabel');

    if (audioDeviceLabel != null || videoDeviceLabel != null) {
      String? videoDeviceId;
      String? audioDeviceId;
      List<MediaDeviceInfo> devices =
          await navigator.mediaDevices.enumerateDevices();

      for (MediaDeviceInfo mediaDeviceInfo in devices) {
        switch (mediaDeviceInfo.kind) {
          case "videoinput":
            if (mediaDeviceInfo.label == videoDeviceLabel) {
              videoDeviceId = mediaDeviceInfo.deviceId;
            }
            break;
          case "audioinput":
            if (mediaDeviceInfo.label == videoDeviceLabel) {
              audioDeviceId = mediaDeviceInfo.deviceId;
            }
            break;
        }
      }

      if (videoDeviceId != null || audioDeviceId != null) {
        final Map<String, dynamic> mediaConstraints = {
          'audio': audioDeviceId != null ? {'deviceId': audioDeviceId} : true,
          'video': videoDeviceId != null ? {'deviceId': videoDeviceId} : true,
        };

        mediaStream =
            await navigator.mediaDevices.getUserMedia(mediaConstraints);
      }
    }
    localMediaStream = mediaStream;
  }

  Future<void> changeCamera(MediaDeviceInfo mediaDeviceInfo) async {
    await (await getPrefs())
        .setString('videoDeviceLabel', mediaDeviceInfo.label);

    await setLocalMediaStream();

    MediaStreamTrack newVideoTrack = localMediaStream!.getVideoTracks()[0];

    if (chatMachine.current?.identifier == ChatStates.connected) {
      (await peerConnection?.senders)?.forEach((element) {
        print("element.track.kind ${element.track?.kind}");
        if (element.track?.kind == 'video') {
          print("replacing video...");
          element.replaceTrack(newVideoTrack);
        }
      });
    }
  }

  Future<void> changeAudioInput(MediaDeviceInfo mediaDeviceInfo) async {
    await (await getPrefs())
        .setString('audioDeviceLabel', mediaDeviceInfo.label);

    await setLocalMediaStream();
    print("got audio stream .. ${localMediaStream?.getAudioTracks()[0]}");

    if (chatMachine.current?.identifier == ChatStates.connected) {
      (await peerConnection?.senders)?.forEach((element) {
        if (element.track?.kind == 'audio') {
          print("replacing audio...");
          element.replaceTrack(localMediaStream?.getAudioTracks()[0]);
        }
      });
    }
  }

  Future<void> changeAudioOutput(MediaDeviceInfo mediaDeviceInfo) async {
    throw "not implemented";
    print("changeAudioOutput...");
    await Helper.selectAudioOutput(mediaDeviceInfo.deviceId);
    // var worked = await localVideoRenderer.audioOutput(mediaDeviceInfo.deviceId);
    print("changeAudioOutput... worked ");
    // await Helper.selectAudioOutput(mediaDeviceInfo.deviceId);
    // await navigator.mediaDevices.selectAudioOutput();
    localVideoRenderer.initialize().then((value) {
      localVideoRenderer.srcObject = _localMediaStream;
      notifyListeners();
    });
  }

  Future<void> sendChatScore(double score) async {
    var url = Uri.parse("${Factory.getOptionsHost()}/providefeedback");
    final headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'authorization': await FirebaseAuth.instance.currentUser!.getIdToken()
    };
    final body = {'feedback_id': feedbackId!, 'score': score};
    return http
        .post(url, headers: headers, body: json.encode(body))
        .then((response) {
      if (validStatusCode(response.statusCode)) {
        return;
      } else {
        const String errorMsg = 'Failed to provide feedback.';
        throw Exception(errorMsg);
      }
    });
  }

  Future<List<PopupMenuEntry<MediaDeviceInfo>>> getDeviceEntries() async {
    List<MediaDeviceInfo> mediaDevices =
        await navigator.mediaDevices.enumerateDevices();

    int deviceCount =
        mediaDevices.where((obj) => obj.deviceId.isNotEmpty).length;

    if (deviceCount == 0) {
      return [
        PopupMenuItem<MediaDeviceInfo>(
            enabled: true,
            child: const Text("Enable Media"),
            onTap: () async {
              print("Enable Media");
              await setLocalMediaStream();
            })
      ];
    }

    SharedPreferences prefs = await getPrefs();

    List<PopupMenuEntry<MediaDeviceInfo>> videoInputList = [
      const PopupMenuItem<MediaDeviceInfo>(
        enabled: false,
        child: Text("Camera"),
      )
    ];
    List<PopupMenuEntry<MediaDeviceInfo>> audioInputList = [
      const PopupMenuItem<MediaDeviceInfo>(
        enabled: false,
        child: Text("Microphone"),
      )
    ];
    List<PopupMenuEntry<MediaDeviceInfo>> audioOutputList = [
      const PopupMenuItem<MediaDeviceInfo>(
        enabled: false,
        child: Text("Speaker"),
      )
    ];

    for (MediaDeviceInfo mediaDeviceInfo in mediaDevices) {
      switch (mediaDeviceInfo.kind) {
        case "videoinput":
          videoInputList.add(PopupMenuItem<MediaDeviceInfo>(
            textStyle: (prefs.getString("videoDeviceLabel") ?? 'Default') ==
                    mediaDeviceInfo.label
                ? const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  )
                : null,
            onTap: () {
              print("click video");
              changeCamera(mediaDeviceInfo);
              // Helper.switchCamera(track)
            },
            value: mediaDeviceInfo,
            child: Text(mediaDeviceInfo.label),
          ));
          break; // The switch statement must be told to exit, or it will execute every case.
        case "audioinput":
          audioInputList.add(PopupMenuItem<MediaDeviceInfo>(
            value: mediaDeviceInfo,
            textStyle: (prefs.getString("audioDeviceLabel") ?? 'Default') ==
                    mediaDeviceInfo.label
                ? const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  )
                : null,
            child: Text(mediaDeviceInfo.label),
            onTap: () {
              print("click audio input");
              changeAudioInput(mediaDeviceInfo);
              // Helper.switchCamera(track)
            },
          ));
          break;
        case "audiooutput":
          audioOutputList.add(PopupMenuItem<MediaDeviceInfo>(
            value: mediaDeviceInfo,
            onTap: () {
              print("click audio input");
              changeAudioOutput(mediaDeviceInfo);
              // Helper.switchCamera(track)
            },
            child: Text(mediaDeviceInfo.label),
          ));
          break;
      }
    }

    return videoInputList + audioInputList; // + audioOutputList;
  }
}
