import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
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

        // bool? socketActive = appProvider?.socket?.connected;
        // appProvider.peerConnection.connectionState
        // "${appProvider?.socket?.connected} ${appProvider?.peerConnection?.connectionState}"

        return SizedBox(
            height: 1000,
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
                    child: Text('New chat: ${appProvider?.socket?.connected}'),
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
  await appProvider.ready();
}
