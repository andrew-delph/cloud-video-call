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

  @protected
  @mustCallSuper
  void initState() {
    print("AppWidget initState1111111111111111111111111111");
    socket = io.io('http://localhost:4000');
    socket.onConnect((_) {
      print('connect');
      socket.emit('message', 'test flutter');
    });
    socket.on('message', (data) => print(data));
    socket.onDisconnect((_) => print('disconnect'));
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppController>(
      builder: (context, appController, child) {
        // appController.initLocal();

        return SizedBox(
            height: 200,
            child: Row(children: [
              Consumer<AppController>(
                builder: (context, appController, child) => Stack(
                  children: [
                    TextButton(
                      onPressed: () {
                        appController.initLocal();
                        print("pressed");
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
                  child: RTCVideoView(appController.localVideoRenderer),
                ),
              ),
              Flexible(
                child: Container(
                  key: Key('remote'),
                  // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
                  decoration: BoxDecoration(color: Colors.black),
                  child: RTCVideoView(appController.localVideoRenderer),
                ),
              ),
            ]));
      },
    );
  }
}
