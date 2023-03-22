import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/Factory.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';

import '../../AppProvider.dart';
import '../LoadingWidget.dart';
import 'FeedbackScreen.dart';

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
          Text("Socket Address: ${Factory.getWsHost()}"),
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
        // appProvider.init();
        appProvider.init(
            onSocketStateChange: handleSocketStateChange,
            onPeerConnectionStateChange: handlePeerConnectionStateChange);

        // if connected to peerconnection. show end chat
        // if not connected to peerconnection
        //      if not connected to socket. show new chat
        //      if not connected to socket. show error

        isInChat() {
          return appProvider.chatMachine.current?.identifier ==
              ChatStates.connected;
        }

        // if socket is connecting
        if (appProvider.socketMachine.current?.identifier ==
            SocketStates.connecting) return connectingWidget;

        // if socket is waiting for established
        if (appProvider.socketMachine.current?.identifier !=
            SocketStates.established) return loadingWidget;

        if (appProvider.chatMachine.current?.identifier ==
            ChatStates.feedback) {
          return FeedbackScreen(
              label: 'Submit Feedback', appProvider: appProvider);
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

        return Flex(
          direction: Axis.horizontal,
          children: [
            Container(
              width: 100,
              color: Colors.white,
              child: chatButton,
            ),
            Expanded(
              child: Stack(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          color: Colors.black,
                          child: RTCVideoView(appProvider.localVideoRenderer),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          color: Colors.black,
                          child: RTCVideoView(appProvider.remoteVideoRenderer),
                        ),
                      ),
                    ],
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: Icon(Icons.call_end),
                          onPressed: () {},
                        ),
                        IconButton(
                          icon: Icon(Icons.mic_off),
                          onPressed: () {},
                        ),
                        IconButton(
                          icon: Icon(Icons.videocam_off),
                          onPressed: () {},
                        ),
                        SettingsButton(appProvider),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );

    return child;
  }
}

enum SampleItem { itemOne, itemTwo, itemThree }

class SettingsButton extends StatelessWidget {
  AppProvider appProvider;

  SettingsButton(this.appProvider, {super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<MediaDeviceInfo>>(
      future: navigator.mediaDevices.enumerateDevices(),
      builder: (context, snapshot) {
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
        if (snapshot.hasData) {
          for (MediaDeviceInfo mediaDeviceInfo in snapshot.data!) {
            switch (mediaDeviceInfo.kind) {
              case "videoinput":
                videoInputList.add(PopupMenuItem<MediaDeviceInfo>(
                  onTap: () {
                    print("click video");
                    appProvider.changeCamera(mediaDeviceInfo);
                    // Helper.switchCamera(track)
                  },
                  value: mediaDeviceInfo,
                  child: Text(mediaDeviceInfo.label),
                ));
                break; // The switch statement must be told to exit, or it will execute every case.
              case "audioinput":
                audioInputList.add(PopupMenuItem<MediaDeviceInfo>(
                  value: mediaDeviceInfo,
                  child: Text(mediaDeviceInfo.label),
                  onTap: () {
                    print("click audio input");
                    appProvider.changeAudioInput(mediaDeviceInfo);
                    // Helper.switchCamera(track)
                  },
                ));
                break;
              case "audiooutput":
                audioOutputList.add(PopupMenuItem<MediaDeviceInfo>(
                  value: mediaDeviceInfo,
                  child: Text(mediaDeviceInfo.label),
                ));
                break;
            }
          }
        }

        List<PopupMenuEntry<MediaDeviceInfo>> mediaList =
            videoInputList + audioInputList + audioOutputList;
        final RenderBox renderBox = context.findRenderObject() as RenderBox;
        //*get the global position, from the widget local position
        final offset = renderBox.localToGlobal(Offset.zero);

        //*calculate the start point in this case, below the button
        final left = offset.dx;
        final top = offset.dy + renderBox.size.height;
        //*The right does not indicates the width
        final right = left + renderBox.size.width;
        return IconButton(
          icon: const Icon(Icons.settings),
          onPressed: () {
            showMenu(
                context: context,
                position: RelativeRect.fromLTRB(left, top, right, 0.0),
                items: mediaList);
          },
        );
      },
    );
  }
}
