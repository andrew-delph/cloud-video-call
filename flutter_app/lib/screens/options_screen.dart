// Dart imports:

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:package_info_plus/package_info_plus.dart';

// Project imports:
import '../controllers/options_controller.dart';
import '../services/auth_service.dart';
import '../services/local_preferences_service.dart';
import '../widgets/app_menu_widget.dart';

class OptionsScreen extends GetView<PreferencesController> {
  const OptionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    LocalPreferences localPreferences = Get.find();

    return Obx(() => WillPopScope(
        onWillPop: () async {
          if (!controller.unsavedChanges()) return true;

          bool confirm = await Get.dialog(AlertDialog(
            title: const Text('You have unsaved changes.'),
            content: const Text('Do you want to discard your changes?'),
            actions: [
              TextButton(
                onPressed: () => Get.back(result: false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Get.back(result: true),
                child: const Text('Discard'),
              ),
            ],
          ));
          return confirm;
        },
        child: AppMenu(
            title: 'Options',
            body: Container(
                alignment: Alignment.topCenter,
                padding: const EdgeInsets.all(20),
                constraints: const BoxConstraints(
                  maxWidth: 1000,
                ),
                child: SingleChildScrollView(
                    child: Column(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: const [
                        Text(
                          "Profile",
                          style: TextStyle(
                            fontSize: 35.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Divider(),
                        UserProfileWidget(),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text(
                          "Settings",
                          style: TextStyle(
                            fontSize: 35.0,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Divider(),
                        Column(children: [
                          Row(
                            children: [
                              const Text("Swipe:"),
                              Switch(
                                value: localPreferences.swipeFeedback(),
                                onChanged: (bool newValue) async {
                                  localPreferences.swipeFeedback(newValue);
                                },
                              )
                            ],
                          ),
                          Row(
                            children: [
                              const Text("Swipe-Popup:"),
                              Switch(
                                value: localPreferences.feedbackPopup(),
                                onChanged: (bool newValue) async {
                                  localPreferences.feedbackPopup(newValue);
                                },
                              )
                            ],
                          ),
                          Row(
                            children: [
                              const Text("Auto Queue:"),
                              Switch(
                                value: localPreferences.autoQueue(),
                                onChanged: (bool newValue) async {
                                  localPreferences.autoQueue(newValue);
                                },
                              )
                            ],
                          ),
                          Row(
                            children: [
                              const Text("Dark Mode:"),
                              Switch(
                                value: localPreferences.isDarkMode(),
                                onChanged: (bool newValue) async {
                                  localPreferences.isDarkMode.toggle();
                                },
                              )
                            ],
                          )
                        ]),
                      ],
                    ),
                    const AppDetailsWidget()
                  ],
                ))))));

    // child: LeftNav(title: 'Options', body: profile));
  }
}

class UserProfileWidget extends GetView<PreferencesController> {
  const UserProfileWidget({super.key});

  @override
  Widget build(BuildContext context) {
    AuthService authService = Get.find();
    User? user = authService.user();

    if (user == null) return const Text("Failed to load user.");

    String? displayName = user.displayName;
    String? email = user.email;

    return Column(
      children: [
        user.isAnonymous
            ? Row(
                children: const [Text("This user is Anonymous.")],
              )
            : Column(children: [
                Row(
                  children: [
                    const Text("Display Name: "),
                    Text(displayName ?? "No display name")
                  ],
                ),
                Row(
                  children: [const Text("Email: "), Text(email ?? "No email")],
                ),
              ]),
        Row(
          children: [
            const Text("Priority: "),
            Text("${controller.priority()}")
          ],
        )
      ],
    );
  }
}

class AppDetailsWidget extends StatelessWidget {
  const AppDetailsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: PackageInfo.fromPlatform(),
        builder: (context, snapshot) {
          String version = "None";

          if (snapshot.hasData && snapshot.data?.version != null) {
            version = snapshot.data?.version ?? "None";
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text("Version", textAlign: TextAlign.center),
              Text(version, textAlign: TextAlign.center)
            ],
          );
        });
  }
}
