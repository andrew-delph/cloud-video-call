// Dart imports:
import 'dart:async';
import 'dart:developer';
import 'dart:typed_data';

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart' hide navigator;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:socket_io_client/socket_io_client.dart';

// Project imports:
import 'package:flutter_app/widgets/approval_widget.dart';
import '../config/factory.dart';
import '../services/auth_service.dart';
import '../services/local_preferences_service.dart';
import '../services/options_service.dart';
import '../utils/utils.dart';
import '../widgets/matchmaker_progress.dart';
import '../widgets/video_render_layout.dart';

class HomeController extends GetxController with StateMixin<Widget> {
  LocalPreferences localPreferences = Get.find();
  final AuthService authService = Get.find();
  final OptionsService optionsService;

  Rx<MediaStream?> localMediaStream = Rx(null);
  Rx<MediaStream?> remoteMediaStream = Rx(null);
  Rx<RTCPeerConnection?> peerConnection = Rx(null);
  Rx<RTCVideoRenderer> localVideoRenderer = RTCVideoRenderer().obs;
  Rx<RTCVideoRenderer> remoteVideoRenderer = RTCVideoRenderer().obs;

  Rx<List<MediaDeviceInfo>> mediaDevicesList = Rx([]);

  Rx<MediaStreamTrack?> localVideoTrack = Rx(null);
  Rx<MediaStreamTrack?> localAudioTrack = Rx(null);

  Rx<MediaStreamTrack?> remoteVideoTrack = Rx(null);
  Rx<MediaStreamTrack?> remoteAudioTrack = Rx(null);

  Rx<io.Socket?> socket = Rx(null);
  int? matchId;

  RxDouble localVideoRendererRatioHw = 0.0.obs;
  RxDouble remoteVideoRendererRatioHw = 0.0.obs;

  RxBool isInReadyQueue = false.obs;
  RxBool isInChat = false.obs;
  RxBool isMicMute = false.obs;
  RxBool isCamHide = false.obs;

  RxMap<dynamic, dynamic> matchmakerProgess = {}.obs;

  HomeController(
    this.optionsService,
  );

  @override
  onInit() async {
    print("init HomeController");
    super.onInit();

    remoteMediaStream.listen((remoteMediaStream) {
      log("remoteMediaStream changed!");
      remoteVideoTrack(remoteMediaStream?.getVideoTracks().firstOrNull);
      remoteAudioTrack(remoteMediaStream?.getAudioTracks().firstOrNull);
      remoteVideoRenderer.update((remoteVideoRenderer) async {
        await remoteVideoRenderer!.initialize();
        remoteVideoRenderer.srcObject = remoteMediaStream;
      });
    });

    localMediaStream.listen((localMediaStream) async {
      log("localMediaStream changed!");
      localVideoTrack(localMediaStream?.getVideoTracks().firstOrNull);
      localAudioTrack(localMediaStream?.getAudioTracks().firstOrNull);
      localVideoRenderer.update((localVideoRenderer) {
        localVideoRenderer?.initialize().then((_) {
          localVideoRenderer.srcObject = localMediaStream;
        }).then((value) {
          localVideoRenderer.onResize = () {
            localVideoRendererRatioHw(
                localVideoRenderer.videoHeight / localVideoRenderer.videoWidth);
            log("localVideoRenderer.onResize");
          };
        });
      });
      (await peerConnection()?.senders)?.forEach((element) {
        if (element.track?.kind == 'audio') {
          log("replacing audio...");
          element.replaceTrack(localAudioTrack());
        }
      });

      (await peerConnection()?.senders)?.forEach((element) {
        log("element.track.kind ${element.track?.kind}");
        if (element.track?.kind == 'video') {
          log("replacing video...");
          element.replaceTrack(localVideoTrack());
        }
      });
    });

    localVideoTrack.listen((localVideoTrack) {
      localVideoTrack?.enabled = !isCamHide();
    });

    isCamHide.listen((isCamHide) {
      localVideoTrack()?.enabled = !isCamHide;
    });

    localAudioTrack.listen((localAudioTrack) {
      Helper.setMicrophoneMute(isMicMute(), localAudioTrack!);
    });

    isMicMute.listen((isMicMute) {
      Helper.setMicrophoneMute(isMicMute, localAudioTrack()!);
    });

    isInChat.listen((isInChat) {
      matchmakerProgess({});
      if (isInChat) {
        isInReadyQueue(false);
        change(VideoRenderLayout(), status: RxStatus.success());
      }
    });

    isInReadyQueue.listen((isInReadyQueue) {
      print("isInReadyQueue $isInReadyQueue");
      matchmakerProgess({});
      if (isInReadyQueue) {
        change(const MatchmakerProgress(), status: RxStatus.success());
      } else {
        change(null, status: RxStatus.success());
      }
    });

    if (!authService.isAuthenticated()) {
      change(null, status: RxStatus.success());
      return;
    }

    await initSocket();
  }

  int activeCount = 1;

  @override
  Future<void> onClose() async {
    super.dispose();
    socket()?.dispose();
    try {
      await localMediaStream()?.dispose();
    } catch (error) {
      print("error: $error");
    }
    try {
      await remoteMediaStream()?.dispose();
    } catch (error) {
      print("error: $error");
    }

    try {
      await peerConnection()?.close();
    } catch (error) {
      print("error: $error");
    }
  }

  Future<void> initSocket() async {
    Socket? oldSocket = socket();
    if (oldSocket != null) {
      print("dispose old socket");
      oldSocket.dispose();
    }
    String socketAddress = Factory.getWsHost();

    log("SOCKET_ADDRESS is $socketAddress .... ${socket() == null}");

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

    socket(mySocket);

    // force set the auth
    mySocket.auth = {"auth": token};

    mySocket.emit("message", "I am a client");

    mySocket.on("myping", (request) async {
      List data = request as List;
      // String value = data[0] as String;
      Function callback = data[1] as Function;

      callback("flutter responded");
    });

    mySocket.emitWithAck("myping", "I am a client",
        ack: (data) => log("ping ack"));

    mySocket.on('activeCount', (data) {
      activeCount = int.tryParse(data.toString()) ?? -1;
    });

    mySocket.on('established', (data) async {
      DateTime now = DateTime.now();
      print("established $now");
      change(null, status: RxStatus.success());
    });

    mySocket.on('matchmakerProgess', (data) async {
      matchmakerProgess(data);
    });

    mySocket.onConnect((_) {
      mySocket.emit('message', 'from flutter app connected');
      socket.refresh();
    });

    mySocket.on('message', (data) => log(data));
    mySocket.on('endchat', (data) async {
      await endChat(!isInChat());
    });

    mySocket.onDisconnect((details) {
      socket.refresh();
      print("onDisconnect: $details");
      // if not disconnected by the client.
      if (!"$details".contains("client")) {
        initSocket();
      }
    });

    mySocket.onConnectError((details) {
      change(null, status: RxStatus.error(details.toString()));
    });

    mySocket.on('error', (details) {
      change(null, status: RxStatus.error(details.toString()));
    });

    mySocket.on('activity', (details) async {
      print("activity");
      Uint8List? bytes = await takePhoto();
      await uploadActivity(bytes);
    });

    socket(mySocket);

    change(null, status: RxStatus.loading());

    try {
      mySocket.connect();
    } catch (error) {
      change(null, status: RxStatus.error(error.toString()));
    }
  }

  Future<void> initLocalStream() async {
    await localMediaStream()?.dispose();

    localMediaStream(await _getLocalMediaStream());
  }

  Future<void> resetRemote() async {
    if (peerConnection() != null) {
      try {
        await peerConnection()?.close();
      } catch (error) {
        print("error: $error");
      }
    }
    await resetRemoteMediaStream();
  }

  Future<void> ready() async {
    if (socket() == null) {
      await initSocket();
    }
    queueReady().catchError(
        (error) => {change(null, status: RxStatus.error(error.toString()))});
  }

  Future<void> queueReady() async {
    await resetRemote();
    await initLocalStream();
    matchmakerProgess({});
    socket()!.off("client_host");
    socket()!.off("client_guest");
    socket()!.off("match");
    socket()!.off("icecandidate");

    // START SETUP PEER CONNECTION

    final tempPeerConnection = await Factory.createPeerConnection();
    tempPeerConnection.onConnectionState =
        (RTCPeerConnectionState connectionState) {
      isInChat([
        RTCPeerConnectionState.RTCPeerConnectionStateConnecting,
        RTCPeerConnectionState.RTCPeerConnectionStateConnected
      ].contains(connectionState));

      // if Failed it means the webrtc connection did not work and queue ready again
      if (connectionState ==
          RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        queueReady();
      }
    };

    // END SETUP PEER CONNECTION

    // START add localMediaStream to peerConnection
    localMediaStream()!.getTracks().forEach((track) async {
      await tempPeerConnection.addTrack(track, localMediaStream()!);
    });

    // START add localMediaStream to peerConnection

    // START collect the streams/tracks from remote
    tempPeerConnection.onAddStream = (stream) {
      // log("onAddStream");
      remoteMediaStream(stream);
    };
    tempPeerConnection.onAddTrack = (stream, track) async {
      // log("onAddTrack");
      await addRemoteTrack(track);
    };
    tempPeerConnection.onTrack = (RTCTrackEvent track) async {
      // log("onTrack");
      await addRemoteTrack(track.track);
    };
    // END collect the streams/tracks from remote

    socket()!.on("match", (request) async {
      late dynamic value;
      Function? callback;
      try {
        List data = request as List;
        value = data[0] as dynamic;
        callback = data[1] as Function;
      } catch (err) {
        value = request;
      }

      String? role = value["role"];

      String? approve = value["approve"];

      if (approve != null) {
        if (callback != null) {
          if (localPreferences.autoAccept()) {
            callback({"approve": true});
          }
          change(ApprovalWidget(approve, callback));
        }
        return;
      }

      bool? success = value["success"];

      if (success != null) {
        if (success) {
        } else {
          String errorMsg = value["error_msg"] ?? "Unknown match error";
          print("Failed to match: $errorMsg");
          errorSnackbar("Failed to match", errorMsg);
          await queueReady();
        }
        return;
      }

      List? iceServers = value["iceServers"];
      matchId = value["match_id"];
      log("match_id: $matchId");
      if (matchId == null) {
        log('matchId == null', error: true);
        throw 'matchId == null';
      }

      if (iceServers == null) {
        log('iceServers == null', error: true);
        throw 'iceServers == null';
      }

      tempPeerConnection
          .setConfiguration(Factory.getRtcConfiguration(iceServers));
      switch (role) {
        case "host":
          {
            setClientHost().catchError((error) {
              log("setClientHost error! $error", error: true);
            }).then((value) {
              log("completed setClientHost");
            });
          }
          break;
        case "guest":
          {
            setClientGuest().catchError((error) {
              log.printError(info: error.toString());
            }).then((value) {
              log("completed setClientGuest");
            });
          }
          break;
        default:
          {
            log.printError(info: "role is not host/guest: $role");
          }
          break;
      }
      if (callback != null) callback(null);
    });

    // START HANDLE ICE CANDIDATES
    tempPeerConnection.onIceCandidate = (event) {
      log("my candidate: ${event.candidate.toString()}");
      socket()!.emit("icecandidate", {
        "icecandidate": {
          'candidate': event.candidate,
          'sdpMid': event.sdpMid,
          'sdpMlineIndex': event.sdpMLineIndex
        }
      });
    };
    socket()!.on("icecandidate", (data) async {
      log("other candidate: ${data["icecandidate"]['candidate'].toString()}");
      RTCIceCandidate iceCandidate = RTCIceCandidate(
          data["icecandidate"]['candidate'],
          data["icecandidate"]['sdpMid'],
          data["icecandidate"]['sdpMlineIndex']);
      tempPeerConnection.addCandidate(iceCandidate);
    });
    // END HANDLE ICE CANDIDATES

    peerConnection(tempPeerConnection);
    final completer = Completer<void>();
    socket()!.emitWithAck("ready", {'ready': true}, ack: (data) {
      log("ready ack $data");

      var readyAck = data["ready"];
      if (!readyAck) {
        errorSnackbar("Error", data["error"] ?? "Uknown Ready Error");

        isInReadyQueue(false);
      } else {
        isInReadyQueue(true);
        isInReadyQueue.refresh();
      }
      completer.complete();
    });
    return completer.future;
  }

  Future<void> endChat(bool skipFeedback) async {
    log("end chat skipFeedback=$skipFeedback");
    socket()?.emit("endchat", {"match_id": matchId});
    await resetRemote();
    isInReadyQueue(localPreferences.autoQueue());
    isInChat(false);

    // if (!skipFeedback) {
    //   double score = await Get.dialog(FeedbackDialog());
    //   await sendChatScore(score);
    // }
    if (localPreferences.autoQueue()) {
      await queueReady();
    }
  }

  Future<void> unReady() async {
    socket()!.off("client_host");
    socket()!.off("client_guest");
    socket()!.off("match");
    socket()!.off("icecandidate");
    socket()!.emitWithAck("ready", {'ready': false}, ack: (data) {
      log("ready ack $data");
      isInReadyQueue(false);
    });
  }

  Future<void> setClientHost() async {
    log("you are the host");

    final tempPeerConnection = peerConnection();
    if (tempPeerConnection == null) {
      print("peerConnection is null");
      throw "peerConnection is null";
    }
    final completer = Completer<void>();

    RTCSessionDescription offerDescription =
        await tempPeerConnection.createOffer();
    await tempPeerConnection.setLocalDescription(offerDescription);

    // send the offer
    socket()!.emit("client_host", {
      "offer": {
        "type": offerDescription.type,
        "sdp": offerDescription.sdp,
      },
    });

    socket()!.on("client_host", (data) {
      try {
        if (data['answer'] != null) {
          // log("got answer");
          RTCSessionDescription answerDescription = RTCSessionDescription(
              data['answer']["sdp"], data['answer']["type"]);
          tempPeerConnection.setRemoteDescription(answerDescription);
          completer.complete();
        }
      } catch (error) {
        completer.completeError(error);
      }
    });

    return completer.future;
  }

  Future<void> setClientGuest() async {
    log("you are the guest");
    final tempPeerConnection = peerConnection();
    if (tempPeerConnection == null) {
      print("peerConnection is null");
      throw "peerConnection is null";
    }
    final completer = Completer<void>();

    socket()!.on("client_guest", (data) async {
      try {
        if (data["offer"] != null) {
          // log("got offer");
          await tempPeerConnection.setRemoteDescription(RTCSessionDescription(
              data["offer"]["sdp"], data["offer"]["type"]));

          RTCSessionDescription answerDescription =
              await tempPeerConnection.createAnswer();

          await tempPeerConnection.setLocalDescription(answerDescription);

          // send the offer
          socket()!.emit("client_guest", {
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
    await remoteMediaStream()!.addTrack(track);
    remoteVideoRenderer().initialize().then((value) {
      remoteVideoRenderer().srcObject = remoteMediaStream();

      // TODO open pr or issue on https://github.com/flutter-webrtc/flutter-webrtc
      // you cannot create a MediaStream
      if (WebRTC.platformIsWeb) {
        remoteVideoRenderer().muted = false;
        log(" (WebRTC.platformIsWebremoteVideoRenderer!.muted = false;");
      }
    });
  }

  Future<void> resetRemoteMediaStream() async {
    remoteMediaStream(await createLocalMediaStream("remote"));
  }

  Future<MediaStream> _getLocalMediaStream() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': true,
    };
    MediaStream mediaStream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);

    String audioDeviceLabel = localPreferences.audioDeviceLabel();
    String videoDeviceLabel = localPreferences.videoDeviceLabel();

    String? videoDeviceId;
    String? audioDeviceId;

    mediaDevicesList(await navigator.mediaDevices.enumerateDevices());

    for (MediaDeviceInfo mediaDeviceInfo in mediaDevicesList()) {
      switch (mediaDeviceInfo.kind) {
        case "videoinput":
          if (mediaDeviceInfo.label == videoDeviceLabel) {
            videoDeviceId = mediaDeviceInfo.deviceId;
          }
          break;
        case "audioinput":
          if (mediaDeviceInfo.label == audioDeviceLabel) {
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

      mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    }

    return mediaStream;
  }

  Future<void> changeCamera(MediaDeviceInfo mediaDeviceInfo) async {
    localPreferences.videoDeviceLabel(mediaDeviceInfo.label);

    await initLocalStream();
  }

  Future<void> changeAudioInput(MediaDeviceInfo mediaDeviceInfo) async {
    localPreferences.audioDeviceLabel(mediaDeviceInfo.label);

    await initLocalStream();
    log("got audio stream .. ${localMediaStream()?.getAudioTracks()[0]}");
  }

  Future<void> changeAudioOutput(MediaDeviceInfo mediaDeviceInfo) async {
    throw "not implemented";
  }

  Future<void> sendChatScore(double score) async {
    log("sending score $score");
    final body = {'match_id': matchId!, 'score': score};
    return optionsService.updateFeedback(body).then((response) {
      if (validStatusCode(response.statusCode)) {
        return;
      } else {
        const String errorMsg = 'Failed to provide feedback.';
        throw Exception(errorMsg);
      }
    }).catchError((error) {
      errorSnackbar("Error", error.toString());
    });
  }

  List<PopupMenuEntry<MediaDeviceInfo>> getDeviceEntries() {
    int deviceCount =
        mediaDevicesList().where((obj) => obj.deviceId.isNotEmpty).length;

    if (deviceCount == 0) {
      return [
        PopupMenuItem<MediaDeviceInfo>(
            enabled: true,
            child: const Text("Enable Media"),
            onTap: () async {
              log("Enable Media");
              await initLocalStream();
            })
      ];
    }

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

    List<PopupMenuEntry<MediaDeviceInfo>> optionsList = [
      const PopupMenuItem<MediaDeviceInfo>(
        enabled: false,
        child: Text("Options"),
      )
    ];

    optionsList.add(PopupMenuItem<MediaDeviceInfo>(
      textStyle: const TextStyle(),
      child: const Text("Reload devices"),
      onTap: () {
        _getLocalMediaStream();
      },
    ));

    for (MediaDeviceInfo mediaDeviceInfo in mediaDevicesList()) {
      switch (mediaDeviceInfo.kind) {
        case "videoinput":
          videoInputList.add(PopupMenuItem<MediaDeviceInfo>(
            textStyle:
                localPreferences.videoDeviceLabel() == mediaDeviceInfo.label
                    ? const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      )
                    : null,
            onTap: () {
              log("click video");
              changeCamera(mediaDeviceInfo);
              // Helper.switchCamera(track)
            },
            value: mediaDeviceInfo,
            child: Text(mediaDeviceInfo.label),
          ));
          break;
        case "audioinput":
          audioInputList.add(PopupMenuItem<MediaDeviceInfo>(
            value: mediaDeviceInfo,
            textStyle:
                localPreferences.audioDeviceLabel() == mediaDeviceInfo.label
                    ? const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      )
                    : const TextStyle(),
            child: Text(mediaDeviceInfo.label),
            onTap: () {
              log("click audio input");
              changeAudioInput(mediaDeviceInfo);
            },
          ));
          break;
        case "audiooutput":
          audioOutputList.add(PopupMenuItem<MediaDeviceInfo>(
            value: mediaDeviceInfo,
            onTap: () {
              log("click audio input");
              changeAudioOutput(mediaDeviceInfo);
            },
            child: Text(mediaDeviceInfo.label),
          ));
          break;
      }
    }

    return videoInputList + audioInputList + optionsList; // + audioOutputList;
  }

  Future<Uint8List?> takePhoto() async {
    ByteBuffer? bytes = await localVideoTrack()?.captureFrame();

    return bytes?.asUint8List();
  }

  Future<void> uploadActivity(Uint8List? bytes) async {
    if (bytes == null) {
      return;
    }

    User currentUser = authService.getUser();

    var fileName = currentUser.uid;

    DateTime now = DateTime.now();

    var imageRef = (FirebaseStorage.instance.ref('activity/$fileName/$now'));
    await imageRef.putData(bytes, SettableMetadata(contentType: "image/png"));
  }

  void emitEvent(String event, dynamic data) {
    socket()!.emit(event, data);
  }

  void listenEvent(
      String event, Future<dynamic> Function(dynamic) dataHandler) {
    socket()!.on(event, (request) async {
      late dynamic value;
      Function? callback;
      try {
        List data = request as List;
        value = data[0] as dynamic;
        callback = data[1] as Function;
      } catch (err) {
        value = request;
      }
      var callbackData = await dataHandler(value);
      if (callbackData != null && callback != null) {
        callback(callbackData);
      }
    });
  }
}
