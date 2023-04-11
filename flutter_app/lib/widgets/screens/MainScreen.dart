import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../AppProvider.dart';
import 'ChatScreen.dart';
import 'OptionsScreen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<StatefulWidget> createState() {
    return MainScreenState();
  }
}

class MainScreenState extends State<MainScreen> {
  late AppProvider appProvider;

  @override
  void initState() {
    super.initState();
    appProvider = AppProvider();
  }

  @override
  Widget build(BuildContext context) {
    String title = 'Random video chat';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Options',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const OptionsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: const Center(
        child: ChatScreen(),
      ),
    );
  }
}
