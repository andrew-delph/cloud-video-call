import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/Factory.dart';
import 'package:flutter_app/state_machines.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../AppProvider.dart';
import '../../utils.dart';
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
    navigator.mediaDevices.ondevicechange = (event) async {
      print('++++++ ondevicechange ++++++');
      setState(() {});
    };
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
    showDialogAlert(-1, const Text("Socket Error"), content);
  }

  @override
  Widget build(BuildContext context) {
    var child = Consumer<AppProvider>(
      builder: (consumerContext, appProvider, child) {
        appProvider.init(
          handleErrorCallback: handleError,
        );

        isInChat() {
          return appProvider.chatMachine.current?.identifier ==
              ChatStates.connected;
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

        Widget videoRenderLayout;

        double width = MediaQuery.of(context).size.width;
        double height = MediaQuery.of(context).size.height;

        appProvider.localVideoRenderer.onResize = () {
          print(
              "resize.... ${appProvider.localVideoRenderer.videoWidth} ${appProvider.localVideoRenderer.videoHeight}");
          setState(() {});
        };

        if (width < height) {
          videoRenderLayout = Stack(
            children: [
              Expanded(
                child: Container(
                  color: Colors.black,
                  child: RTCVideoView(
                    appProvider.remoteVideoRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  ),
                ),
              ),
              Positioned(
                bottom: 20, // get the size of the row buttons..?
                right: 0,
                child: Container(
                  alignment: Alignment.bottomRight,
                  width: appProvider.localVideoRenderer.videoWidth.toDouble(),
                  height: appProvider.localVideoRenderer.videoHeight.toDouble(),
                  constraints: BoxConstraints(
                    maxWidth: width / 2,
                    maxHeight: height / 3,
                  ),
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
                                icon: const Icon(Icons.mic_off),
                                onPressed: () {},
                              ),
                              IconButton(
                                icon: const Icon(Icons.videocam_off),
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

class SettingsButton extends StatelessWidget {
  final AppProvider appProvider;

  const SettingsButton(this.appProvider, {super.key});

  @override
  Widget build(BuildContext context) {
    Future<Pair<List<MediaDeviceInfo>, SharedPreferences>>
        enumerateDevices() async {
      return Pair<List<MediaDeviceInfo>, SharedPreferences>(
          await navigator.mediaDevices.enumerateDevices(),
          await appProvider.getPrefs());
    }

    return FutureBuilder<Pair<List<MediaDeviceInfo>, SharedPreferences>>(
      future: enumerateDevices(),
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
          List<MediaDeviceInfo> mediaDevices = snapshot.data!.first;
          SharedPreferences prefs = snapshot.data!.second;
          for (MediaDeviceInfo mediaDeviceInfo in mediaDevices) {
            switch (mediaDeviceInfo.kind) {
              case "videoinput":
                videoInputList.add(PopupMenuItem<MediaDeviceInfo>(
                  textStyle:
                      (prefs.getString("videoDeviceLabel") ?? 'Default') ==
                              mediaDeviceInfo.label
                          ? const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            )
                          : null,
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
                  textStyle:
                      (prefs.getString("audioDeviceLabel") ?? 'Default') ==
                              mediaDeviceInfo.label
                          ? const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            )
                          : null,
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
                  onTap: () {
                    print("click audio input");
                    appProvider.changeAudioOutput(mediaDeviceInfo);
                    // Helper.switchCamera(track)
                  },
                  child: Text(mediaDeviceInfo.label),
                ));
                break;
            }
          }
        }

        List<PopupMenuEntry<MediaDeviceInfo>> mediaList =
            videoInputList + audioInputList; // + audioOutputList;

        return PopupMenuButton<MediaDeviceInfo>(
          // initialValue: 'selectedMenu',
          // Callback that sets the selected popup menu item.
          itemBuilder: (BuildContext context) => mediaList,
        );
      },
    );
  }
}
