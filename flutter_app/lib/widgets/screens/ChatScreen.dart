import 'package:flutter/material.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../AppProvider.dart';
import '../../utils.dart';
import '../LoadingWidget.dart';
import '../SwipeDetector.dart';
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
    print("ChatScreenState dispose");
  }

  @override
  void deactivate() {
    super.deactivate();
    print("ChatScreenState deactivate");
  }

  @override
  void initState() {
    super.initState();
    AppProvider appProvider = context.read<AppProvider>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      appProvider.socketMachine.current = SocketStates.connecting;
      appProvider.init(handleErrorCallback: handleError);
    });

    print("ChatScreenState initState");
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

  void handleError(ErrorDetails details) {
    var content = IntrinsicHeight(
      child: Column(
        children: [
          Text(details.title),
          const Text(""),
          Text(
              style: const TextStyle(
                color: Colors.red,
              ),
              details.message),
        ],
      ),
    );
    showDialogAlert(
        details.message.hashCode, const Text("Socket Error"), content);
  }

  @override
  Widget build(BuildContext context) {
    var child = Consumer<AppProvider>(
      builder: (consumerContext, appProvider, child) {
        isInChat() {
          return appProvider.chatMachine.current?.identifier ==
              ChatStates.connected;
        }

        inReadyQueue() {
          return appProvider.chatMachine.current?.identifier ==
              ChatStates.ready;
        }

        // if socket is connecting
        if (appProvider.socketMachine.current?.identifier ==
            SocketStates.connecting) return connectingWidget;

        // if socket is error
        if (appProvider.socketMachine.current?.identifier ==
            SocketStates.error) {
          return errorWidget;
        }

        // if socket is waiting for established
        if (appProvider.socketMachine.current?.identifier !=
            SocketStates.established) return loadingWidget;

        if (appProvider.chatMachine.current?.identifier ==
            ChatStates.feedback) {
          return FeedbackScreen(
              label: 'Submit Feedback', appProvider: appProvider);
        }

        double width = MediaQuery.of(context).size.width;
        double height = MediaQuery.of(context).size.height;

        Widget chatButton = TextButton(
            style: ButtonStyle(
              backgroundColor: MaterialStateProperty.all<Color>(
                  Colors.yellow.shade100), // Change the color here
            ),
            onPressed: () async {
              if (!inReadyQueue()) {
                await appProvider.ready();
              } else {
                await appProvider.unReady();
              }
            },
            child: Text((inReadyQueue() == false) ? 'Ready' : 'Cancel Ready'));

        Widget videoRenderLayout;

        double ratioHW = 0;

        if (appProvider.localVideoRenderer.videoHeight != 0 &&
            appProvider.localVideoRenderer.videoWidth != 0) {
          ratioHW = appProvider.localVideoRenderer.videoHeight /
              appProvider.localVideoRenderer.videoWidth;
        }

        if (width < height) {
          videoRenderLayout = Stack(
            children: [
              Container(
                color: Colors.black,
                child: RTCVideoView(
                  appProvider.remoteVideoRenderer,
                  // objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                ),
              ),
              Positioned(
                bottom: 20, // get the size of the row buttons..?
                right: 0,
                child: Container(
                  alignment: Alignment.bottomRight,
                  width: width / 2,
                  height: (width / 2) * ratioHW,
                  child: RTCVideoView(
                    appProvider.localVideoRenderer,
                  ),
                ),
              ),
            ],
          );
        } else {
          videoRenderLayout = Row(
            children: [
              Expanded(
                child: Container(
                  color: Colors.black,
                  child: RTCVideoView(appProvider.remoteVideoRenderer),
                ),
              ),
              Expanded(
                child: Container(
                  color: Colors.black,
                  child: RTCVideoView(appProvider.localVideoRenderer),
                ),
              ),
            ],
          );
        }

        videoRenderLayout = SwipeDetector(
            isDragUpdate: () {
              return isInChat();
            },
            onHorizontalDragEnd: (double score) {
              appProvider.chatMachine.current =
                  ChatStates.ended; // will show feedback screen not good.
              appProvider
                  .sendChatScore(score)
                  .then((value) {})
                  .catchError((error) {
                SnackBar snackBar = SnackBar(
                  content: Text(error.toString()),
                );

                ScaffoldMessenger.of(context).showSnackBar(snackBar);
              }).whenComplete(() {
                appProvider.chatMachine.current = ChatStates.waiting;
              });
            },
            child: videoRenderLayout);

        return Flex(
          direction: Axis.horizontal,
          children: [
            isInChat() == false
                ? Container(
                    width: 100,
                    color: Colors.white,
                    child: chatButton,
                  )
                : Container(),
            Expanded(
              child: Stack(
                children: [
                  videoRenderLayout,
                  appProvider.localMediaStream == null
                      ? Container()
                      : Positioned(
                          left: 0,
                          right: 0,
                          bottom: 20,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              IconButton(
                                tooltip: "End call",
                                icon: const Icon(Icons.call_end),
                                color: isInChat() ? Colors.red : Colors.grey,
                                onPressed: () {
                                  if (isInChat()) {
                                    appProvider.chatMachine.current =
                                        ChatStates.ended;
                                  }
                                },
                              ),
                              IconButton(
                                tooltip: "Mute mic",
                                color: appProvider.isMuteMic()
                                    ? Colors.red
                                    : Colors.grey,
                                icon: appProvider.isMuteMic()
                                    ? const Icon(Icons.mic_off)
                                    : const Icon(Icons.mic),
                                onPressed: () {
                                  appProvider.toggleMuteMic();
                                },
                              ),
                              IconButton(
                                tooltip: "Camera off",
                                color: appProvider.isHideCam()
                                    ? Colors.red
                                    : Colors.grey,
                                icon: appProvider.isHideCam()
                                    ? const Icon(Icons.videocam_off)
                                    : const Icon(Icons.videocam),
                                onPressed: () {
                                  appProvider.toggleHideCam();
                                },
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

class SettingsButton extends StatelessWidget {
  final AppProvider appProvider;

  const SettingsButton(this.appProvider, {super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<PopupMenuEntry<MediaDeviceInfo>>>(
      future: appProvider.getDeviceEntries(),
      builder: (context, snapshot) {
        List<PopupMenuEntry<MediaDeviceInfo>> mediaList = [];

        if (snapshot.hasData) {
          mediaList = snapshot.data ?? [];
        }

        return PopupMenuButton<MediaDeviceInfo>(
          color: Colors.grey,
          // initialValue: 'selectedMenu',
          // Callback that sets the selected popup menu item.
          itemBuilder: (BuildContext context) => mediaList,
        );
      },
    );
  }
}
