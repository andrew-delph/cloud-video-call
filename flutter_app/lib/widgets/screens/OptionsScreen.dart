import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/utils.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../../AppProvider.dart';
import '../../MapNotifier.dart';
import '../../location.dart';
import '../../preferences_service.dart';
import '../LoadingWidget.dart';
import '../map/map_widget.dart';

class OptionsScreen extends StatelessWidget {
  double priority = 0;

  final PreferencesService preferencesService = PreferencesService();

  bool loading = false;

  OptionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    AppProvider appProvider = Provider.of<AppProvider>(context);

    preferencesService.loadAttributes();

    Widget profile = Container(
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
                          preferenceMap: preferencesService.constantAttributes,
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
                          preferenceMap: preferencesService.constantAttributes,
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
                                preferencesService.updateAttributes();
                              },
                        child: const Text('Submit'),
                      ),
                    );
                  })
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
              children: [profile, settings, const AppDetailsWidget()],
            )))));
  }
}

class LocationOptionsWidget extends StatelessWidget {
  final Map<String, String> customAttributes;
  final Map<String, String> customFilters;

  final valueController =
      TextEditingController(); // Controller for the value text field

  isValid() {
    return customAttributes["long"] != null && customAttributes["lat"] != null;
  }

  canReset() {
    return customAttributes["long"] != null ||
        customAttributes["lat"] != null ||
        customFilters["dist"] != null;
  }

  reset() {
    customAttributes.remove('long');
    customAttributes.remove('lat');
    customFilters.remove('dist');
  }

  updateLocation(context) async {
    Position pos = await getLocation().catchError((onError) {
      String errorMsg = onError.toString();
      SnackBar snackBar = SnackBar(
        content: Text(errorMsg),
      );

      ScaffoldMessenger.of(context).showSnackBar(snackBar);
      throw onError;
    });
    customAttributes["long"] = pos.latitude.toString();
    customAttributes["lat"] = pos.longitude.toString();
    print("pos $pos ${pos.latitude} ${pos.longitude}");

    String msg = "Latitude: ${pos.latitude} Longitude: ${pos.longitude}";
    SnackBar snackBar = SnackBar(
      content: Text(msg),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  LocationOptionsWidget(
      {super.key, required this.customAttributes, required this.customFilters});

  @override
  Widget build(BuildContext context) {
    Pair<double, double>? posPair;

    String? lat = customAttributes["lat"];
    String? long = customAttributes["long"];

    if (long != null && lat != null) {
      try {
        posPair = Pair(double.parse(long), double.parse(lat));
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    }

    double dist = -1;

    valueController.text = customFilters["dist"] ?? 'None';

    if (customFilters["dist"] != null) {
      print("customFilters.get('dist') is ${customFilters["dist"]}");
      try {
        dist = double.parse(customFilters["dist"]!);
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    } else {
      print("customFilters.get('dist') == null");
    }

    return Column(children: [
      Wrap(
        children: [
          ElevatedButton(
            onPressed: () {
              updateLocation(context);
            },
            child: const Text('Update Location'),
          ),
          ElevatedButton(
            onPressed: canReset() ? reset : null,
            child: const Text('Clear'),
          ),
          isValid()
              ? Text('Max Distance Km: ${dist < 0 ? 'None' : dist.toInt()}')
              : Container()
        ],
      ),
      posPair != null
          ? SizedBox(
              width: 300,
              height: 300,
              child: MapWidget(posPair, dist, true, (double eventDist) {
                print("updating dist value $eventDist");
                customFilters["dist"] = eventDist.toString();
              }),
            )
          : Container(),
    ]);
  }
}

class DropDownPreference extends StatelessWidget {
  final String label;
  final String mapKey;
  final List<String> options;
  final Map<String, String> preferenceMap;

  const DropDownPreference(
      {super.key,
      required this.label,
      required this.options,
      required this.preferenceMap,
      required this.mapKey});

  @override
  Widget build(BuildContext context) {
    return Obx(() => SizedBox(
        width: 400,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("$label:"),
            SizedBox(
                child: DropdownButton<String>(
              value: preferenceMap[mapKey] ?? naValue,
              icon: const Icon(Icons.arrow_drop_down),
              elevation: 16,
              style: const TextStyle(color: Colors.purple),
              underline: Container(
                height: 2,
                color: Colors.purpleAccent,
              ),
              onChanged: (String? value) {
                preferenceMap[mapKey] = value!;
              },
              items: options.map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                    value: value,
                    child: SizedBox(
                      width: 70,
                      child: Text(
                        value,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ));
              }).toList(),
            ))
          ],
        )));
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
