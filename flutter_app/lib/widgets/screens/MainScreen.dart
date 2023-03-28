import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../AppProvider.dart';
import 'ChatScreen.dart';
import 'OptionsScreen.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

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
                  MaterialPageRoute(
                      builder: (context) => const OptionsScreen()),
                );
              },
            ),
          ],
        ),
        body: Center(
          child: ElevatedButton(
            child: const Center(
              child: ChatScreen(),
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
