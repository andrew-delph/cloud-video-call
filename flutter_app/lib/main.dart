import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'AppController.dart';
import 'AppWidget.dart';

void main() {
  final Map<String, dynamic> mediaConstraints = {'audio': true, 'video': true};

  runApp(
    ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo test',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: const AppWidget(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  // int _counter = 0;

  _MyHomePageState();

  // final _localVideoRenderer = RTCVideoRenderer();
  //
  // void initRenderers() async {
  //   await _localVideoRenderer.initialize();
  // }

  // @override
  // void initState() {
  //   print("init");
  //   initRenderers();
  //   _getUserMedia();
  //   super.initState();
  // }

  // @override
  // void dispose() async {
  //   // await _localVideoRenderer.dispose();
  //   super.dispose();
  // }

  // _getUserMedia() async {
  //   final Map<String, dynamic> mediaConstraints = {
  //     'audio': true,
  //     'video': true
  //   };
  //   MediaStream stream =
  //       await navigator.mediaDevices.getUserMedia(mediaConstraints);
  //   _localVideoRenderer.srcObject = stream;
  // }

  // void _incrementCounter() {
  //   setState(() {
  //     // _counter++;
  //   });
  // }

  // @override
  // Widget build(BuildContext context) {
  //   return Scaffold(
  //     appBar: AppBar(
  //       title: Text(widget.title),
  //     ),
  //     body: Center(
  //       child: Column(
  //         mainAxisAlignment: MainAxisAlignment.center,
  //         children: <Widget>[
  //           const Text(
  //             'You have pushed the button this many times:1',
  //           ),
  //           Text(
  //             '$_counter $_counter',
  //             style: Theme.of(context).textTheme.headline4,
  //           ),
  //       ),
  //     ),
  //     floatingActionButton: FloatingActionButton(
  //       onPressed: _incrementCounter,
  //       tooltip: 'Increment',
  //       child: const Icon(Icons.add),
  //     ),
  //   );
  // }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
        height: 210,
        child: Row(children: [
          // Consumer<AppController>(
          //   builder: (context, appController, child) => Stack(
          //     children: [
          //       TextButton(
          //         onPressed: () {
          //           appController.add("TESTSETTE");
          //           print("pressed");
          //         },
          //         child: const Text('button test'),
          //       ),
          //     ],
          //   ),
          // ),
          // Consumer<AppController>(
          //   builder: (context, appController, child) => Stack(
          //     children: [
          //       Text('Total price: ${appController.items}'),
          //     ],
          //   ),
          // ),

          // AppWidget(),
          Text("text now")

          // Flexible(
          //   child: Container(
          //     key: Key('local'),
          //     // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
          //     decoration: BoxDecoration(color: Colors.black),
          //     child: RTCVideoView(_localVideoRenderer),
          //   ),
          // ),
          // Flexible(
          //   child: Container(
          //     key: Key('remote'),
          //     // margin: EdgeInsets.fromLTRB(5.0, 5.0, 5.0, 5.0),
          //     decoration: BoxDecoration(color: Colors.black),
          //     child: RTCVideoView(_localVideoRenderer),
          //   ),
          // ),
        ]));
  }
}
