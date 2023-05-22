// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class LeftNav extends StatelessWidget {
  final Widget body;
  final String title;

  const LeftNav({super.key, required this.body, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text(title),
          actions: <Widget>[
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
              onPressed: () async {
                Get.find<AuthService>().signOut();
              },
            ),
          ],
        ),
        body: Row(
          children: [
            SizedBox(
                width: 72.0,
                child: Column(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.home),
                      // tooltip: 'Home',
                      onPressed: () {
                        Get.toNamed(Routes.HOME);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings),
                      // tooltip: 'Options',
                      onPressed: () {
                        Get.toNamed(Routes.OPTIONS);
                      },
                    ),
                  ],
                )),
            Expanded(
              child: body,
            ),
          ],
        ));
  }
}
