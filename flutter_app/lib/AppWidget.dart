import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'AppController.dart';

class AppWidget extends StatefulWidget {
  const AppWidget({super.key});

  @override
  State<StatefulWidget> createState() {
    // TODO: implement createState
    return AppWidgetState();
  }
}

class AppWidgetState extends State<AppWidget> {
  late io.Socket socket;
  bool connected = false;

  @protected
  @mustCallSuper
  void initState() {
    print("AppWidget initState1111111111111111111111111111");
    socket = io.io('http://localhost:4000');
    socket.onConnect((_) {
      print('connect');
      connected = true;
      socket.emit('message', 'test flutter');
    });
    socket.on('message', (data) => print(data));
    socket.onDisconnect((_) {
      connected = false;
      print('disconnect');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appController, child) {
        // appController.initLocal();

        return SizedBox(
            height: 200,
            child: Row(children: [
              Consumer<AppProvider>(
                builder: (context, appController, child) => Stack(
                  children: [
                    TextButton(
                      onPressed: () async {
                        await appController.initLocal();
                        print("pressed");
                        await readyPress(appController, socket);
                        print("done ready");
                      },
                      child: const Text('button test'),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: Container(
                    key: Key('local'),
                    // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
                    decoration: BoxDecoration(color: Colors.black),
                    child: RTCVideoView(appController.localVideoRenderer)),
              ),
              Flexible(
                child: Container(
                    key: Key('local'),
                    // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
                    decoration: BoxDecoration(color: Colors.black),
                    child: RTCVideoView(appController.remoteVideoRenderer)),
              ),
            ]));
      },
    );
  }
}

final Map<String, dynamic> rtcConfiguration = {
  "iceServers": [
    {
      "urls": [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
      ],
    },
    {
      "urls": ["turn:relay.metered.ca:80"],
      "username": "db5611baf2f55446ccb6a207",
      "credential": "95Cmq0CBYp6WiHDA",
    },
  ],
  "iceCandidatePoolSize": 10,
};

final Map<String, dynamic> offerSdpConstraints = {
  "mandatory": {
    "OfferToReceiveAudio": true,
    "OfferToReceiveVideo": true,
  },
  "optional": [],
};

Future<void> readyPress(AppProvider appProvider, io.Socket socket) async {
  socket.emit("ready");
  socket.on("set_client_host", (value) async {
    await setClientHost(appProvider, socket, value);
  });

  socket.on("set_client_guest", (value) async {
    await setClientGuest(appProvider, socket, value);
  });
}

Future<void> setClientHost(
    AppProvider appProvider, io.Socket socket, value) async {
  print("you are the host");
  socket.off("client_host");
  socket.off("client_guest");

  RTCPeerConnection peerConnection =
      await createPeerConnection(rtcConfiguration, offerSdpConstraints);

  peerConnection.addStream(appProvider.localMediaStream);

  peerConnection.onIceCandidate = (event) {
    socket.emit(
        "client_host",
        jsonEncode({
          "icecandidate": {
            'candidate': event.candidate,
            'sdpMid': event.sdpMid,
            'sdpMlineIndex': event.sdpMLineIndex
          }
        }));
  };

  peerConnection.onAddStream = (MediaStream stream) {
    print('addStream: ' + stream.id);
    appProvider.remoteMediaStream = stream;
  };

  RTCSessionDescription offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // send the offer
  socket.emit(
      "client_host",
      jsonEncode({
        "offer": {
          "type": offerDescription.type,
          "sdp": offerDescription.sdp,
        },
      }));

  socket.on("client_host", (data) {
    data = jsonDecode(data);

    if (data['answer'] != null) {
      print("got answer");
      RTCSessionDescription answerDescription =
          RTCSessionDescription(data['answer']["sdp"], data['answer']["type"]);
      peerConnection.setRemoteDescription(answerDescription);
    }

    // Listen for remote ICE candidates below
    if (data["icecandidate"] != null) {
      RTCIceCandidate iceCandidate = RTCIceCandidate(
          data["icecandidate"]['candidate'],
          data["icecandidate"]['sdpMid'],
          data["icecandidate"]['sdpMlineIndex']);
      peerConnection.addCandidate(iceCandidate);
    }
  });

  appProvider.peerConnection = peerConnection;
}

Future<void> setClientGuest(
    AppProvider appProvider, io.Socket socket, value) async {
  print("you are the guest");
  socket.off("client_host");
  socket.off("client_guest");

  RTCPeerConnection peerConnection =
      await createPeerConnection(rtcConfiguration, offerSdpConstraints);

  peerConnection.addStream(appProvider.localMediaStream);

  peerConnection.onIceCandidate = (event) {
    socket.emit(
        "client_guest",
        jsonEncode({
          "icecandidate": {
            'candidate': event.candidate,
            'sdpMid': event.sdpMid,
            'sdpMlineIndex': event.sdpMLineIndex
          }
        }));
  };

  peerConnection.onAddStream = (MediaStream stream) {
    print('addStream: ' + stream.id);
    appProvider.remoteMediaStream = stream;
  };

  socket.on("client_guest", (data) async {
    data = jsonDecode(data);

    if (data["offer"] != null) {
      await peerConnection.setRemoteDescription(
          RTCSessionDescription(data["offer"]["sdp"], data["offer"]["type"]));

      RTCSessionDescription answerDescription =
          await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(answerDescription);

      // send the offer
      socket.emit(
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
      peerConnection.addCandidate(iceCandidate);
    }
  });

  appProvider.peerConnection = peerConnection;
}
