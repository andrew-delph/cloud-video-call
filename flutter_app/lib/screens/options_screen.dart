import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/utils/utils.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../services/app_service.dart';
import '../services/preferences_service.dart';
import '../widgets/LoadingWidget.dart';
import '../widgets/dropdown_preference_widget.dart';
import '../widgets/history_widget.dart';
import '../widgets/location_options.dart';

class OptionsScreen extends StatelessWidget {
  double priority = 0;

  final PreferencesService preferencesService = PreferencesService();

  bool loading = false;

  OptionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AppProvider appProvider = Provider.of<AppProvider>(context);

    preferencesService.loadAttributes();

    Widget profile = Obx(() {
      return Container(
          alignment: Alignment.topCenter,
          decoration: BoxDecoration(
            color: Colors.teal,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.all(20),
          constraints: const BoxConstraints(
            maxWidth: 1000,
          ),
          child: preferencesService.loading.value
              ? connectingWidget
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      "Profile",
                      style: TextStyle(
                        fontSize: 35.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const Divider(),
                    UserProfileWidget(
                      priority: priority,
                    ),
                    const Divider(),
                    Container(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Text(
                            'Attributes',
                            style: TextStyle(
                              fontSize: 24.0,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          DropDownPreference(
                            label: 'Gender',
                            options: const [naValue, "Male", "Female", "Other"],
                            preferenceMap:
                                preferencesService.constantAttributes,
                            mapKey: 'gender',
                          ),
                          DropDownPreference(
                            label: 'Language',
                            options: const [
                              naValue,
                              "English",
                              "French",
                              "Other"
                            ],
                            preferenceMap:
                                preferencesService.constantAttributes,
                            mapKey: 'language',
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    Container(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Text(
                            'Filters',
                            style: TextStyle(
                              fontSize: 24.0,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          DropDownPreference(
                            label: 'Gender',
                            options: const [naValue, "Male", "Female", "Other"],
                            preferenceMap: preferencesService.constantFilters,
                            mapKey: 'gender',
                          ),
                          DropDownPreference(
                            label: 'Language',
                            options: const [
                              naValue,
                              "English",
                              "French",
                              "Other"
                            ],
                            preferenceMap: preferencesService.constantFilters,
                            mapKey: 'language',
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    Container(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Text(
                            'Location Settings',
                            style: TextStyle(
                              fontSize: 24.0,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          LocationOptionsWidget(
                              customAttributes:
                                  preferencesService.customAttributes,
                              customFilters: preferencesService.customFilters),
                        ],
                      ),
                    ),
                    Obx(() {
                      return SizedBox(
                        height: 50,
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: !preferencesService.unsavedChanges.value
                              ? null
                              : () async {
                                  await preferencesService.updateAttributes();
                                  Get.snackbar('Updated',
                                      'Preferences have been updated',
                                      snackPosition: SnackPosition.BOTTOM);
                                },
                          child: const Text('Submit'),
                        ),
                      );
                    })
                  ],
                ));
    });

    Widget history = Container(
        alignment: Alignment.topCenter,
        decoration: BoxDecoration(
          color: Colors.teal,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(20),
        margin: const EdgeInsets.all(20),
        constraints: const BoxConstraints(
          maxWidth: 1000,
        ),
        child: loading
            ? connectingWidget
            : Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Text(
                    "History",
                    style: TextStyle(
                      fontSize: 35.0,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const Divider(),
                  HistoryWidget()
                ],
              ));

    FutureBuilder devices =
        FutureBuilder<List<PopupMenuEntry<MediaDeviceInfo>>>(
      future: appProvider.getDeviceEntries(),
      builder: (context, snapshot) {
        List<Widget> mediaList = [
          const Text(
            "Devices",
            style: TextStyle(
              fontSize: 24.0,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          )
        ];

        if (snapshot.hasData) {
          mediaList = mediaList + (snapshot.data ?? []);
        }

        return Container(
            alignment: Alignment.topCenter,
            decoration: BoxDecoration(
              color: Colors.teal,
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.all(20),
            constraints: const BoxConstraints(
              maxWidth: 1000,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: mediaList,
            ));
      },
    );

    Widget preferences = FutureBuilder<Options>(
      future: Options.getOptions(),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          bool confirmFeedbackPopup =
              snapshot.data?.getConfirmFeedbackPopup() ?? true;
          bool autoQueue = snapshot.data?.getAutoQueue() ?? false;
          return Column(children: [
            Row(
              children: [
                const Text("Swipe feedback popup:"),
                Switch(
                  value: confirmFeedbackPopup,
                  onChanged: (bool newValue) async {
                    await snapshot.data?.setConfirmFeedbackPopup(newValue);
                  },
                )
              ],
            ),
            Row(
              children: [
                const Text("Auto queue:"),
                Switch(
                  value: autoQueue,
                  onChanged: (bool newValue) async {
                    await snapshot.data?.setAutoQueue(newValue);
                  },
                )
              ],
            )
          ]);
        } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );

    Widget settings = Container(
        alignment: Alignment.topCenter,
        decoration: BoxDecoration(
          color: Colors.teal,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(20),
        margin: const EdgeInsets.all(20),
        constraints: const BoxConstraints(
          maxWidth: 1000,
        ),
        child: loading
            ? connectingWidget
            : Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Text(
                    "Settings",
                    style: TextStyle(
                      fontSize: 35.0,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const Divider(),
                  preferences,
                  const Divider(),
                  devices
                ],
              ));

    return WillPopScope(
        onWillPop: () async {
          if (!preferencesService.unsavedChanges.value) return true;
          bool confirm = await showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text('You have unsaved changes.'),
                content: const Text('Do you want to discard your changes?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(true),
                    child: const Text('Discard'),
                  ),
                ],
              );
            },
          );
          return confirm;
        },
        child: Scaffold(
            appBar: AppBar(
              title: const Text('Options screen'),
            ),
            body: Center(
                child: SingleChildScrollView(
                    child: Column(
              children: [profile, history, settings, const AppDetailsWidget()],
            )))));
  }
}

class UserProfileWidget extends StatelessWidget {
  UserProfileWidget({super.key, required this.priority});

  double priority;

  @override
  Widget build(BuildContext context) {
    User? user = FirebaseAuth.instance.currentUser;

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
          children: [const Text("Priority: "), Text("$priority")],
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
              ListTile(
                title: const Text("Version", textAlign: TextAlign.center),
                subtitle: Text(version, textAlign: TextAlign.center),
              ),
            ],
          );
        });
  }
}
