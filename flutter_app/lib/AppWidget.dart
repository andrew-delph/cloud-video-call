import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';

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
  @override
  Widget build(BuildContext context) {
    return Consumer<AppController>(
      builder: (context, appController, child) {
        // appController.initLocal();

        return SizedBox(
            height: 200,
            child: Row(children: [
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
