import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';

import 'AppController.dart';

class AppWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    Widget child = Text(
      "the child text",
    );
    return Consumer<AppController>(
      builder: (context, appController, child) {
        // appController.initLocal();
        return Flexible(
          child: Container(
            key: Key('local'),
            // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
            decoration: BoxDecoration(color: Colors.black),
            child: RTCVideoView(appController.localVideoRenderer),
          ),
        );
      },
    );
  }
}
