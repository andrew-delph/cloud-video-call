import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/factory.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'AppController.dart';

class AppWidget extends StatefulWidget {
  const AppWidget({super.key});

  @override
  State<StatefulWidget> createState() {
    return AppWidgetState();
  }
}

class AppWidgetState extends State<AppWidget> {

  @override
  void dispose() {
    super.dispose();
    print("AppWidgetState dispose");
  }

  @override
  void deactivate() {
    super.deactivate();
    print("AppWidgetState deactivate");
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    var child = Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        appProvider.init();

        return  SizedBox(
            height: 200,
            child: Row(children: [
              Stack(
                children: [
                  TextButton(
                    onPressed: () async {
                      await appProvider.initLocalStream();
                      print("pressed");
                      await readyPress(appProvider);
                      print("done ready");
                    },
                    child: const Text('button test3'),
                  ),
                ],
              ),
              Flexible(
                child: Container(
                    key: const Key('local'),
                    // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
                    decoration: const BoxDecoration(color: Colors.black),
                    child: RTCVideoView(appProvider.localVideoRenderer)),
              ),
              Flexible(
                child: Container(
                    key: const Key('local'),
                    // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
                    decoration: const BoxDecoration(color: Colors.black),
                    child: RTCVideoView(appProvider.remoteVideoRenderer)),
              ),
            ]));
      },
    );

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}


Future<void> readyPress(AppProvider appProvider) async {
  await appProvider.resetRemoteMediaStream();
  appProvider.socket!.off("client_host");
  appProvider.socket!.off("client_guest");
  appProvider.socket!.off("set_client_host");
  appProvider.socket!.off("set_client_guest");

  appProvider.socket!.emit("ready");
  appProvider.socket!.on("set_client_host", (value) async {
    await setClientHost(appProvider, value);
  });

  appProvider.socket!.on("set_client_guest", (value) async {
    await setClientGuest(appProvider, value);
  });
}

Future<void> setClientHost(
    AppProvider appProvider, value) async {
  print("you are the host");


  RTCPeerConnection peerConnection = await Factory.createPeerConnection();

  appProvider.localMediaStream!.getTracks().forEach((track) async {
    await peerConnection.addTrack(track, appProvider.localMediaStream!);
  });

  peerConnection.onIceCandidate = (event) {
    appProvider.socket!.emit(
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
  peerConnection.onAddStream = (stream) {
  };
  peerConnection.onAddTrack = (stream, track) async{
    await appProvider.addRemoteTrack(track);
  };
  peerConnection.onTrack = (RTCTrackEvent track) async {
    await appProvider.addRemoteTrack(track.track);
  };

  RTCSessionDescription offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // send the offer
  appProvider.socket!.emit(
      "client_host",
      jsonEncode({
        "offer": {
          "type": offerDescription.type,
          "sdp": offerDescription.sdp,
        },
      }));

  appProvider.socket!.on("client_host", (data) {
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
    AppProvider appProvider, value) async {
  print("you are the guest");

  RTCPeerConnection peerConnection = await Factory.createPeerConnection();



  appProvider.localMediaStream!.getTracks().forEach((track) async {
    await peerConnection.addTrack(track, appProvider.localMediaStream!);
  });


  peerConnection.onIceCandidate = (event) {
    appProvider.socket!.emit(
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
  peerConnection.onAddStream = (stream) {
  };
  peerConnection.onAddTrack = (stream, track) async{
    await appProvider.addRemoteTrack(track);
  };
  peerConnection.onTrack = (RTCTrackEvent track) async {
    await appProvider.addRemoteTrack(track.track);
  };

  appProvider.socket!.on("client_guest", (data) async {
    data = jsonDecode(data);

    if (data["offer"] != null) {
      await peerConnection.setRemoteDescription(
          RTCSessionDescription(data["offer"]["sdp"], data["offer"]["type"]));

      RTCSessionDescription answerDescription =
          await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(answerDescription);

      // send the offer
      appProvider.socket!.emit(
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
