import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/widgets/screens/MainScreen.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'firebase_options.dart';

import 'package:firebase_auth/firebase_auth.dart';

void main() async {
  print("Start main...");

  final Map<String, dynamic> mediaConstraints = {'audio': true, 'video': true};

  MediaStream stream =
      await navigator.mediaDevices.getUserMedia(mediaConstraints);

  List<MediaDeviceInfo> cameras =
      await navigator.mediaDevices.enumerateDevices();

  print("mediaDevices:");
  for (var device in cameras) {
    print(">> ${device.label} ${device.kind}");
    print(".${device.groupId}");
    print(".${device.deviceId}");
  }
  print("");

  // final Map<String, dynamic> mediaConstraints = {'audio': true, 'video': true};

  // MediaStream stream =
  // await navigator.mediaDevices.getUserMedia(mediaConstraints);
  //
  // await navigator.mediaDevices.enumerateDevices();
  //
  // // navigator.mediaDevices.selectAudioOutput();
  // List<MediaDeviceInfo> devices =
  // await navigator.mediaDevices.enumerateDevices();
  // print("devices:");
  // for (var device in devices) {
  //   print(">> ${device.label} ${device.kind}");
  //   print(".${device.groupId}");
  //   print(".${device.deviceId}");
  // }
  // print("");
  //
  //
  // MediaTrackSupportedConstraints supportedConstraints =
  // navigator.mediaDevices.getSupportedConstraints();
  // print("supportedConstraints $supportedConstraints");

  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  FirebaseAuth.instance.idTokenChanges().listen((User? user) async {
    if (user == null) {
      print('User is currently signed out!');
      try {
        final userCredential = await FirebaseAuth.instance.signInAnonymously();
        print("Signed in with temporary account. ${userCredential.user?.uid}");
      } on FirebaseAuthException catch (e) {
        switch (e.code) {
          case "operation-not-allowed":
            print("Anonymous auth hasn't been enabled for this project.");
            break;
          default:
            print("Authentication unknown error: $e");
        }
      }
    } else {
      print('User is signed in!');
    }
  });

  // Position position = await getLocation();

  // print("position: $position");

  //
  // var db = FirebaseFirestore.instance;

  // await db.collection("users").doc("count").get().then((value) {
  //   print("count from firestore ${value.data()}");
  // });

  // db.collection("users").doc("count").snapshots().listen(
  //       (event) => print("live count from firestore: ${event.data()}"),
  //       onError: (error) => print("Listen failed: $error"),
  //     );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    var child =
        Consumer<AppProvider>(builder: (consumerContext, appProvider, child) {
      String title = 'Random video chat (${appProvider.activeCount})';
      return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: title,
          theme: ThemeData(primarySwatch: Colors.green),
          home: const MainScreen());
    });

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}
