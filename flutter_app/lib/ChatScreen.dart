import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/Factory.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'Feedback.dart';

import 'package:http/http.dart' as http;

import 'LoadingWidget.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<StatefulWidget> createState() {
    return ChatScreenState();
  }
}

class ChatScreenState extends State<ChatScreen> {
  Set<int> dialogLock = {};

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

  void showDialogAlert(int lockID, Widget title, Widget content) {
    if (dialogLock.contains(lockID) == true) return;
    if (lockID > 0) dialogLock.add(lockID);
    func() => showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: title,
              content: content,
              actions: <Widget>[
                TextButton(
                  child: const Text("OK"),
                  onPressed: () {
                    dialogLock.remove(lockID);
                    Navigator.of(context).pop();
                  },
                ),
              ],
            );
          },
        );
    // Future.delayed(const Duration(seconds: 0), func);
    Future.microtask(func);
  }

  void handleSocketStateChange(
      SocketConnectionState socketState, dynamic details) {
    var content = IntrinsicHeight(
      child: Column(
        children: [
          Text("Socket Address: ${Factory.getHostAddress()}"),
          const Text(""),
          Text(
              style: const TextStyle(
                color: Colors.red,
              ),
              details.toString()),
        ],
      ),
    );

    switch (socketState) {
      case SocketConnectionState.disconnected:
        {
          showDialogAlert(1, const Text("Socket Disconnect"), content);
        }
        break;
      case SocketConnectionState.connected:
        // TODO: Handle this case.
        break;
      case SocketConnectionState.error:
        showDialogAlert(2, const Text("Socket Error"), content);
        break;
      case SocketConnectionState.connectionError:
        showDialogAlert(3, const Text("Socket Connection Error"), content);
        break;
    }
  }

  void handlePeerConnectionStateChange(
      RTCPeerConnectionState peerConnectionState) {
    switch (peerConnectionState) {
      case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
        // TODO: Handle this case.
        break;
      case RTCPeerConnectionState.RTCPeerConnectionStateClosed:
        // TODO: Handle this case.
        break;
      case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
        // TODO: Handle this case.
        break;
      case RTCPeerConnectionState.RTCPeerConnectionStateNew:
        // TODO: Handle this case.
        break;
      case RTCPeerConnectionState.RTCPeerConnectionStateConnecting:
        // TODO: Handle this case.
        break;
      case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
        // TODO: Handle this case.
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    var child = Consumer<AppProvider>(
      builder: (consumerContext, appProvider, child) {
        appProvider.init();
        // appProvider.init(
        //     onSocketStateChange: handleSocketStateChange,
        //     onPeerConnectionStateChange: handlePeerConnectionStateChange);

        // if connected to peerconnection. show end chat
        // if not connected to peerconnection
        //      if not connected to socket. show new chat
        //      if not connected to socket. show error

        isInChat() {
          return appProvider.chatMachine.current?.identifier ==
              ChatStates.connected;
        }

        // display loading if socket is not established
        isDisplayLoading() {
          return appProvider.socketMachine.current?.identifier !=
              SocketStates.established;
        }

        if (isDisplayLoading()) return loadingWidget;

        if (appProvider.chatMachine.current?.identifier ==
            ChatStates.feedback) {
          return FeedbackWidget(
              min: 0,
              max: 10,
              initialValue: 5,
              onSubmit: (score) async {
                var url = Uri.http(
                    Factory.getHostAddress(), 'options/providefeedback');
                final headers = {
                  'Access-Control-Allow-Origin': '*',
                  'Content-Type': 'application/json',
                  'authorization':
                      await FirebaseAuth.instance.currentUser!.getIdToken(true)
                };
                final body = {
                  'feedback_id': appProvider.feedbackId!,
                  'score': score
                };
                var response = await http.post(url,
                    headers: headers, body: json.encode(body));
                print('Feedback status: ${response.statusCode}');
                print('Feedback body: ${response.body}');

                appProvider.chatMachine.current = ChatStates.waiting;
              },
              label: 'Submit Feedback');
        }

        Widget chatButton = TextButton(
            style: ButtonStyle(
              backgroundColor: MaterialStateProperty.all<Color>(
                  Colors.yellow.shade100), // Change the color here
            ),
            onPressed: () async {
              if (isInChat()) {
                appProvider.chatMachine.current = ChatStates.ended;
              } else {
                await appProvider.ready();
              }
            },
            child: Text((isInChat() == false) ? 'New chat' : 'End chat'));

        return SizedBox(
            width: double.infinity,
            child: Row(children: [
              Container(
                  width: 100,
                  height: double.infinity,
                  color: Colors.white,
                  child: chatButton),
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

    return child;
  }
}
