import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'AppProvider.dart';
import 'AppWidget.dart';
import 'OptionsScreen.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    var child =
        Consumer<AppProvider>(builder: (consumerContext, appProvider, child) {
      String title = 'Random video chat (${appProvider.activeCount})';
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
                  MaterialPageRoute(builder: (context) => OptionsScreen()),
                );
              },
            ),
          ],
        ),
        body: Center(
          child: ElevatedButton(
            child: const Center(
              child: AppWidget(),
            ),
            onPressed: () {
              // Navigator.push(
              //   context,
              //   MaterialPageRoute(builder: (context) => const SecondRoute()),
              // );
            },
          ),
        ),
      );
    });

    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: child,
    );
  }
}
