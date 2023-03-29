import 'package:firebase_auth/firebase_auth.dart';
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

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<StatefulWidget> createState() {
    return LoginScreenState();
  }
}

class LoginScreenState extends State<LoginScreen> {
  @override
  void dispose() {
    super.dispose();
    print("LoginScreenState dispose");
  }

  @override
  void deactivate() {
    super.deactivate();
    print("LoginScreenState deactivate");
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      child: const Text("Login Anonymous"),
      onPressed: () async {
        FirebaseAuth.instance.signInAnonymously().then((value) {
          Navigator.pop(context);
        });
      },
    );
  }
}
