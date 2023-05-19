import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart' hide navigator;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:statemachine/statemachine.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/Factory.dart';
import '../services/auth_service.dart';
import '../utils/state_machines.dart';
import '../utils/utils.dart';

class HomeController extends GetxController with StateMixin {
  Rx<MediaStream?> localMediaStream = Rx(null);
  Rx<MediaStream?> remoteMediaStream = Rx(null);
  Rx<RTCPeerConnection?> peerConnection = Rx(null);
  Rx<RTCVideoRenderer> localVideoRenderer = RTCVideoRenderer().obs;
  Rx<RTCVideoRenderer> remoteVideoRenderer = RTCVideoRenderer().obs;

  Rx<MediaStreamTrack?> localVideoTrack = Rx(null);
  Rx<MediaStreamTrack?> localAudioTrack = Rx(null);

  Rx<io.Socket?> socket = Rx(null);
  String? feedbackId;
  RxBool established = false.obs;

  Machine<SocketStates> socketMachine = getSocketMachine();
  Machine<ChatStates> chatMachine = getChatMachine();

  @override
  onInit() async {
    super.onInit();

    change(null, status: RxStatus.loading());

    remoteMediaStream.listen((remoteMediaStream) {
      remoteVideoRenderer.update((remoteVideoRenderer) async {
        await remoteVideoRenderer!.initialize();
        remoteVideoRenderer.srcObject = remoteMediaStream;
      });
    });

    localMediaStream.listen((localMediaStream) {
      localVideoRenderer.update((localVideoRenderer) {
        localVideoRenderer?.initialize().then((_) {
          localVideoRenderer.srcObject = localMediaStream;
        });
      });
    });

    socketMachine[SocketStates.connecting].onEntry(() async {
      await initSocket();
    });

    socketMachine[SocketStates.error].onTimeout(const Duration(seconds: 3), () {
      socketMachine.current = SocketStates.connecting;
    });

    chatMachine[ChatStates.ended].onEntry(() async {
      if (socket.value != null && socket.value?.connected == true) {
        socket.value!.emit("endchat", "endchat");
      }
      await tryResetRemote();
      chatMachine.current = ChatStates.feedback;
    });

    chatMachine[ChatStates.end].onEntry(() async {
      Options options = await Options.getOptions();
      if (options.getAutoQueue()) {
        chatMachine.current = ChatStates.ready;
      } else {
        chatMachine.current = ChatStates.waiting;
      }
    });

    chatMachine[ChatStates.matched].onTimeout(const Duration(seconds: 10), () {
      chatMachine.current = ChatStates.connectionError;
    });

    chatMachine[ChatStates.connectionError].onEntry(() async {
      chatMachine.current = ChatStates.ready;
    });

    chatMachine[ChatStates.ready].onEntry(() async {
      //TODO handle errors with ack and error
      await readyQueue().catchError((error) async {
        handleError(ErrorDetails("Ready", error.toString()));
        await unReady();
      });
    });

    await initSocket();
  }

  void handleError(ErrorDetails errorDetails) {
    if (handleErrorCallback != null) {
      handleErrorCallback!(errorDetails);
    }
  }

  Function(ErrorDetails errorDetails)? handleErrorCallback;

  int activeCount = 1;

  @override
  Future<void> dispose() async {
    super.dispose();
    socket.value?.destroy();
    chatMachine.stop();
    socketMachine.stop();
    await localMediaStream.value?.dispose();
    await remoteMediaStream.value?.dispose();
    await peerConnection.value?.close();
  }

  Future<void> init(
      {Function(ErrorDetails details)? handleErrorCallback}) async {
    this.handleErrorCallback = handleErrorCallback;
    socketMachine.start();
  }

  Future<void> initSocket() async {
    established(false);
    String socketAddress = Factory.getWsHost();

    print(
        "SOCKET_ADDRESS is $socketAddress $established .... ${socket.value == null}");

    // only websocket works on windows

    AuthService authService = Get.find<AuthService>();

    String token = await authService.getToken();

    Socket mySocket = io.io(
        socketAddress,
        OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .disableReconnection()
            .build());

    if (mySocket.connected) {
      mySocket.dispose();
    }

    // force set the auth
    mySocket.auth = {"auth": token};

    mySocket.emit("message", "I am a client");

    mySocket.on("myping", (request) async {
      List data = request as List;
      String value = data[0] as String;
      Function callback = data[1] as Function;

      callback("flutter responded");
    });

    mySocket.emitWithAck("myping", "I am a client",
        ack: (data) => print("ping ack"));

    mySocket.on('activeCount', (data) {
      activeCount = int.tryParse(data.toString()) ?? -1;
    });

    mySocket.on('established', (data) {
      print("established");
      established(true);
      socketMachine.current = SocketStates.established;
      change(null, status: RxStatus.success());
    });

    mySocket.onConnect((_) {
      socketMachine.current = SocketStates.connected;
      mySocket.emit('message', 'from flutter app connected');
    });

    mySocket.on('message', (data) => print(data));
    mySocket.on('endchat', (data) async {
      print("got endchat event");
      if (chatMachine.current?.identifier == ChatStates.connected) {
        chatMachine.current = ChatStates.ended;
      }
    });
    mySocket.onDisconnect((details) {
      if (socketMachine.current != null) {
        socketMachine.current = SocketStates.error;
      }
    });

    mySocket.onConnectError((error) {
      print('connectError $error');

      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    });

    mySocket.on('error', (error) {
      print("error $error");
      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    });

    try {
      mySocket.connect();
    } catch (error) {
      print("socket connect error...$error");
      handleError(ErrorDetails("Socket", error.toString()));
      socketMachine.current = SocketStates.error;
    }

    socket(mySocket);
  }

  Future<void> initLocalStream() async {
    if (localMediaStream.value != null) return;
    await localMediaStream.value?.dispose();

    localVideoRenderer.value?.onResize = () {
      print("localVideoRenderer.onResize!!!!!!!!!!!!!!!!!!!!!!!!!");
    };

    try {
      await setLocalMediaStream();
    } catch (error) {
      handleError(ErrorDetails("initLocalStream", error.toString()));
    }
  }

  Future<void> tryResetRemote() async {
    if (peerConnection.value != null) {
      await peerConnection.value?.close();
    }
    await resetRemoteMediaStream();
  }

  Future<void> ready() async {
    chatMachine.current = ChatStates.ready;
  }

  Future<void> readyQueue() async {
    await tryResetRemote();
    await initLocalStream();
    socket.value!.off("client_host");
    socket.value!.off("client_guest");
    socket.value!.off("match");
    socket.value!.off("icecandidate");

    // START SETUP PEER CONNECTION
    peerConnection(await Factory.createPeerConnection());
    peerConnection.value?.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        chatMachine.current = ChatStates.connected;
      } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected) {
        chatMachine.current = ChatStates.connectionError;
      }
    };
    // END SETUP PEER CONNECTION

    // START add localMediaStream to peerConnection
    localMediaStream.value!.getTracks().forEach((track) async {
      await peerConnection.value!.addTrack(track, localMediaStream.value!);
    });

    // START add localMediaStream to peerConnection

    // START collect the streams/tracks from remote
    peerConnection.value!.onAddStream = (stream) {
      // print("onAddStream");
      remoteMediaStream(stream);
    };
    peerConnection.value!.onAddTrack = (stream, track) async {
      // print("onAddTrack");
      await addRemoteTrack(track);
    };
    peerConnection.value!.onTrack = (RTCTrackEvent track) async {
      // print("onTrack");
      await addRemoteTrack(track.track);
    };
    // END collect the streams/tracks from remote

    socket.value!.on("match", (request) async {
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
            setClientHost().catchError((error) {
              print("setClientHost error! $error");
              handleError(ErrorDetails("Match Error", error.toString()));
            }).then((value) {
              print("completed setClientHost");
            });
          }
          break;
        case "guest":
          {
            setClientGuest().catchError((error) {
              print("setClientGuest error! $error");
              handleError(ErrorDetails("Match Error", error.toString()));
            }).then((value) {
              print("completed setClientGuest");
            });
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
    peerConnection.value!.onIceCandidate = (event) {
      socket.value!.emit("icecandidate", {
        "icecandidate": {
          'candidate': event.candidate,
          'sdpMid': event.sdpMid,
          'sdpMlineIndex': event.sdpMLineIndex
        }
      });
    };
    socket.value!.on("icecandidate", (data) async {
      // print("got ice!");
      RTCIceCandidate iceCandidate = RTCIceCandidate(
          data["icecandidate"]['candidate'],
          data["icecandidate"]['sdpMid'],
          data["icecandidate"]['sdpMlineIndex']);
      peerConnection.value!.addCandidate(iceCandidate);
    });
    // END HANDLE ICE CANDIDATES

    socket.value!.emitWithAck("ready", {'ready': true}, ack: (data) {
      // TODO if ack timeout then do something
      print("ready ack $data");
    });
  }

  Future<void> unReady() async {
    socket.value!.off("client_host");
    socket.value!.off("client_guest");
    socket.value!.off("match");
    socket.value!.off("icecandidate");
    socket.value!.emitWithAck("ready", {'ready': false}, ack: (data) {
      print("ready ack $data");
      chatMachine.current = ChatStates.waiting;
    });
  }

  Future<void> setClientHost() async {
    print("you are the host");
    final completer = Completer<void>();

    RTCSessionDescription offerDescription =
        await peerConnection.value!.createOffer();
    await peerConnection.value!.setLocalDescription(offerDescription);

    // send the offer
    socket.value!.emit("client_host", {
      "offer": {
        "type": offerDescription.type,
        "sdp": offerDescription.sdp,
      },
    });

    socket.value!.on("client_host", (data) {
      try {
        if (data['answer'] != null) {
          // print("got answer");
          RTCSessionDescription answerDescription = RTCSessionDescription(
              data['answer']["sdp"], data['answer']["type"]);
          peerConnection.value!.setRemoteDescription(answerDescription);
          completer.complete();
        }
      } catch (error) {
        completer.completeError(error);
      }
    });

    return completer.future;
  }

  Future<void> setClientGuest() async {
    print("you are the guest");
    final completer = Completer<void>();

    socket.value!.on("client_guest", (data) async {
      try {
        if (data["offer"] != null) {
          // print("got offer");
          await peerConnection.value!.setRemoteDescription(
              RTCSessionDescription(
                  data["offer"]["sdp"], data["offer"]["type"]));

          RTCSessionDescription answerDescription =
              await peerConnection.value!.createAnswer();

          await peerConnection.value!.setLocalDescription(answerDescription);

          // send the offer
          socket.value!.emit("client_guest", {
            "answer": {
              "type": answerDescription.type,
              "sdp": answerDescription.sdp,
            },
          });

          completer.complete();
        }
      } catch (error) {
        completer.completeError(error);
      }
    });
    return completer.future;
  }

  Future<void> addRemoteTrack(MediaStreamTrack track) async {
    await remoteMediaStream.value!.addTrack(track);
    remoteVideoRenderer.value.initialize().then((value) {
      remoteVideoRenderer.value.srcObject = remoteMediaStream.value;

      // TODO open pr or issue on https://github.com/flutter-webrtc/flutter-webrtc
      // you cannot create a MediaStream
      if (WebRTC.platformIsWeb) {
        remoteVideoRenderer.value.muted = false;
        print(" (WebRTC.platformIsWebremoteVideoRenderer!.muted = false;");
      }
    });
  }

  Future<void> resetRemoteMediaStream() async {
    remoteMediaStream(await createLocalMediaStream("remote"));
  }

  Future<void> setLocalMediaStream() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true,
    };

    MediaStream mediaStream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);
    Options options = await Options.getOptions();

    String? audioDeviceLabel = options.getAudioDevice();
    String? videoDeviceLabel = options.getVideoDevice();

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
    localMediaStream(mediaStream);
  }

  Future<void> changeCamera(MediaDeviceInfo mediaDeviceInfo) async {
    Options options = await Options.getOptions();
    options.setVideoDevice(mediaDeviceInfo.label);

    await setLocalMediaStream();

    MediaStreamTrack newVideoTrack =
        localMediaStream.value!.getVideoTracks()[0];

    if (chatMachine.current?.identifier == ChatStates.connected) {
      (await peerConnection.value?.senders)?.forEach((element) {
        print("element.track.kind ${element.track?.kind}");
        if (element.track?.kind == 'video') {
          print("replacing video...");
          element.replaceTrack(newVideoTrack);
        }
      });
    }
  }

  Future<void> changeAudioInput(MediaDeviceInfo mediaDeviceInfo) async {
    Options options = await Options.getOptions();
    options.setAudioDevice(mediaDeviceInfo.label);

    await setLocalMediaStream();
    print("got audio stream .. ${localMediaStream.value?.getAudioTracks()[0]}");

    if (chatMachine.current?.identifier == ChatStates.connected) {
      (await peerConnection.value?.senders)?.forEach((element) {
        if (element.track?.kind == 'audio') {
          print("replacing audio...");
          element.replaceTrack(localMediaStream.value?.getAudioTracks()[0]);
        }
      });
    }
  }

  Future<void> changeAudioOutput(MediaDeviceInfo mediaDeviceInfo) async {
    throw "not implemented";
    print("changeAudioOutput...");
    // await Helper.selectAudioOutput(mediaDeviceInfo.deviceId);
    // // var worked = await localVideoRenderer.audioOutput(mediaDeviceInfo.deviceId);
    // print("changeAudioOutput... worked ");
    // // await Helper.selectAudioOutput(mediaDeviceInfo.deviceId);
    // // await navigator.mediaDevices.selectAudioOutput();
    // localVideoRenderer.initialize().then((value) {
    //   localVideoRenderer.srcObject = localMediaStream;
    //   //notifyListeners();
    // });
  }

  Future<void> sendChatScore(double score) async {
    print("sending score $score");
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

    Options options = await Options.getOptions();

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
            textStyle:
                (options.getVideoDevice() ?? 'Default') == mediaDeviceInfo.label
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
            textStyle:
                (options.getAudioDevice() ?? 'Default') == mediaDeviceInfo.label
                    ? const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      )
                    : const TextStyle(),
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

  bool isHideCam() {
    final finalLocalVideoTrack = localVideoTrack.value;
    if (finalLocalVideoTrack != null) {
      return !finalLocalVideoTrack.enabled;
    }
    return true;
  }

  Future<void> toggleHideCam() async {
    final finalLocalVideoTrack = localVideoTrack.value;
    if (finalLocalVideoTrack != null) {
      finalLocalVideoTrack.enabled = (isHideCam());
    }
  }

  bool isMuteMic() {
    final finalLocalAudioTrack = localAudioTrack.value;
    if (finalLocalAudioTrack != null) {
      return !finalLocalAudioTrack.enabled;
    }
    return true;
  }

  Future<void> toggleMuteMic() async {
    final finalLocalAudioTrack = localAudioTrack.value;
    if (finalLocalAudioTrack != null) {
      Helper.setMicrophoneMute(!(isMuteMic()), finalLocalAudioTrack);
    }
  }
}
