import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

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
    return Column(
      children: [
        const Text("Login..."),
        ElevatedButton(
          child: const Text("Login Anonymous"),
          onPressed: () async {
            await FirebaseAuth.instance.signInAnonymously().then((value) {
              // Navigator.pop(context);
            }).catchError((onError) {
              String msg = onError.toString();
              SnackBar snackBar = SnackBar(
                content: Text(msg),
              );

              ScaffoldMessenger.of(context).showSnackBar(snackBar);
            });
          },
        ),
        ElevatedButton(
          child: const Text("Login Google"),
          onPressed: () async {
            // Create a new provider
            GoogleAuthProvider googleProvider = GoogleAuthProvider();

            googleProvider
                .addScope('https://www.googleapis.com/auth/contacts.readonly');
            googleProvider
                .setCustomParameters({'login_hint': 'user@example.com'});

            // Once signed in, return the UserCredential
            await FirebaseAuth.instance
                .signInWithPopup(googleProvider)
                .then((value) {
              // Navigator.pop(context);
            }).catchError((onError) {
              String msg = onError.toString();
              SnackBar snackBar = SnackBar(
                content: Text(msg),
              );

              ScaffoldMessenger.of(context).showSnackBar(snackBar);
            });
          },
        )
      ],
    );
  }
}
