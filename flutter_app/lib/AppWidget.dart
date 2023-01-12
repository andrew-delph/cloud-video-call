import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/Factory.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';

class AppWidget extends StatefulWidget {
  const AppWidget({super.key});

  @override
  State<StatefulWidget> createState() {
    return AppWidgetState();
  }
}

class AppWidgetState extends State<AppWidget> {
  bool _hasShownAlert = false;

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

  void showDialogAlert(Widget title, Widget content) {
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

  void handleSocketStateChange(SocketConnectionState socketState) {
    switch (socketState) {
      case SocketConnectionState.disconnected:
        {
          showDialogAlert(const Text("Socket Disconnect"),
              Text("Socket Address: ${Factory.getSocketAddress()}"));
        }
        break;
      case SocketConnectionState.connected:
        // TODO: Handle this case.
        break;
      case SocketConnectionState.error:
        showDialogAlert(const Text("Socket Error"),
            Text("Socket Address: ${Factory.getSocketAddress()}"));
        break;
      case SocketConnectionState.connectionError:
        showDialogAlert(const Text("Socket Connection Error"),
            Text("Socket Address: ${Factory.getSocketAddress()}"));
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
        appProvider.init(
            onSocketStateChange: handleSocketStateChange,
            onPeerConnectionStateChange: handlePeerConnectionStateChange);

        // if connected to peerconnection. show end chat
        // if not connected to peerconnection
        //      if not connected to socket. show new chat
        //      if not connected to socket. show error

        Widget loadingWidget = Scaffold(
            body: Center(
          child: LoadingAnimationWidget.staggeredDotsWave(
            color: Colors.blue,
            size: 200,
          ),
        ));

        isInChat() {
          if (appProvider.peerConnection?.connectionState ==
              RTCPeerConnectionState.RTCPeerConnectionStateConnecting) {
            return true;
          }
          if (appProvider.peerConnection?.connectionState ==
              RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
            return true;
          }
          return false;
        }

        // display loading if socket not connected and not in a chat
        isDisplayLoading() {
          if (!appProvider.socket!.connected) {
            return !isInChat();
          }
          return false;
        }

        if (isDisplayLoading()) return loadingWidget;

        Widget newChatButton = TextButton(
          onPressed: () async {
            await appProvider.ready();
          },
          child: const Text('New chat'),
        );

        Widget endChatButton = TextButton(
          onPressed: () async {
            await appProvider.tryResetRemote();
          },
          child: const Text('End chat'),
        );

        Widget buttonToDisplay = (isInChat()) ? endChatButton : newChatButton;

        return SizedBox(
            height: 1000,
            child: Row(children: [
              buttonToDisplay,
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
