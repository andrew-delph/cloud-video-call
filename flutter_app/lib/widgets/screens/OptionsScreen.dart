import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/utils.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import '../../AppProvider.dart';
import '../../Factory.dart';
import '../../location.dart';
import '../LoadingWidget.dart';
import '../map/map_widget.dart';

const String naValue = "Skip";

class MapNotifier extends ChangeNotifier {
  final Map<String, String> _map = {};

  Map<String, String> get map => _map;

  void add(String key, String value, {bool notify = true}) {
    String? preValue = _map[key];
    if (value == naValue || value == "") {
      _map.remove(key);
    } else {
      _map[key] = value;
    }
    if (notify && preValue != value) {
      notifyListeners();
    }
  }

  String? get(String key) {
    return _map[key];
  }

  void addAll(Map<String, String> toAdd) {
    _map.addAll(toAdd);
    notifyListeners();
  }

  void addEntries(Iterable<MapEntry<String, String>> mapEntryList) {
    _map.addEntries(mapEntryList);
    notifyListeners();
  }

  void deleteKey(String key, {bool notify = true}) {
    String? preValue = _map[key];
    _map.remove(key);
    if (notify && preValue != null) {
      notifyListeners();
    }
  }
}

class OptionsScreen extends StatefulWidget {
  const OptionsScreen({super.key});

  @override
  OptionsScreenState createState() => OptionsScreenState();
}

class OptionsScreenState extends State<OptionsScreen> {
  final MapNotifier constantAttributes = MapNotifier();
  final MapNotifier constantFilters = MapNotifier();

  final MapNotifier customAttributes = MapNotifier();
  final MapNotifier customFilters = MapNotifier();

  bool loading = true;
  bool unsavedChanges = false;

  @override
  void initState() {
    super.initState();
    constantAttributes.addListener(() {
      setState(() {
        unsavedChanges = true;
      });
    });
    constantFilters.addListener(() {
      setState(() {
        unsavedChanges = true;
      });
    });

    customAttributes.addListener(() {
      setState(() {
        unsavedChanges = true;
      });
    });
    customFilters.addListener(() {
      setState(() {
        unsavedChanges = true;
      });
    });
    loadAttributes();
  }

  void loadAttributes() {
    setState(() {
      loading = true;
    });
    FirebaseAuth.instance.currentUser!.getIdToken().then((token) {
      var url = Uri.parse("${Factory.getOptionsHost()}/preferences");
      final headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'authorization': token.toString()
      };
      return http.get(url, headers: headers);
    }).then((response) {
      dynamic data = jsonDecode(response.body);
      if (validStatusCode(response.statusCode)) {
      } else {
        String errorMsg =
            (data['message'] ?? 'Failed to load preferences data.').toString();
        SnackBar snackBar = SnackBar(
          content: Text(errorMsg),
        );

        ScaffoldMessenger.of(context).showSnackBar(snackBar);
        Navigator.of(context).pop();
        throw Exception(errorMsg);
      }
      return data;
    }).then((data) {
      if (data["attributes"] is Map && data["attributes"]["constant"] is Map) {
        var temp = data["attributes"]["constant"] as Map;
        constantAttributes.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
      if (data["filters"] is Map && data["filters"]["constant"] is Map) {
        var temp = data["filters"]["constant"] as Map;
        constantFilters.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }

      if (data["attributes"] is Map && data["attributes"]["custom"] is Map) {
        var temp = data["attributes"]["custom"] as Map;
        customAttributes.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
      if (data["filters"] is Map && data["filters"]["custom"] is Map) {
        var temp = data["filters"]["custom"] as Map;
        print("loaded temp... ${temp.toString()}");
        customFilters.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
    }).whenComplete(() {
      setState(() {
        unsavedChanges = false;
        loading = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    AppProvider appProvider = Provider.of<AppProvider>(context);
    Widget preferences = connectingWidget;

    if (true) {
      preferences = Container(
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
                      "Preferences",
                      style: TextStyle(
                        fontSize: 35.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
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
                            preferenceMap: constantAttributes,
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
                            preferenceMap: constantAttributes,
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
                            preferenceMap: constantFilters,
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
                            preferenceMap: constantFilters,
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
                              customAttributes: customAttributes,
                              customFilters: customFilters),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 50,
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: !unsavedChanges
                            ? null
                            : () async {
                                setState(() {
                                  loading = true;
                                });
                                var url = Uri.parse(
                                    "${Factory.getOptionsHost()}/preferences");
                                final headers = {
                                  'Access-Control-Allow-Origin': '*',
                                  'Content-Type': 'application/json',
                                  'authorization': await FirebaseAuth
                                      .instance.currentUser!
                                      .getIdToken()
                                };
                                final body = {
                                  'attributes': {
                                    'constant': constantAttributes.map,
                                    'custom': customAttributes.map
                                  },
                                  'filters': {
                                    'constant': constantFilters.map,
                                    'custom': customFilters.map,
                                  }
                                };
                                http
                                    .put(url,
                                        headers: headers,
                                        body: json.encode(body))
                                    .then((response) {
                                  if (validStatusCode(response.statusCode)) {
                                  } else {
                                    const String errorMsg =
                                        'Failed to update preferences.';
                                    const snackBar = SnackBar(
                                      content: Text(errorMsg),
                                    );

                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(snackBar);
                                    Navigator.of(context).pop();
                                  }
                                  loadAttributes();
                                });
                              },
                        child: const Text('Submit'),
                      ),
                    )
                  ],
                ));
    }

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

    return WillPopScope(
        onWillPop: () async {
          if (unsavedChanges) {
            // Show a dialog or a snackbar to inform the user that there are unsaved changes
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('There are unsaved changes')),
            );
            // Return false to prevent the user from navigating back
            return false;
          } else {
            // Return true to allow the user to navigate back
            return true;
          }
        },
        child: Scaffold(
            appBar: AppBar(
              title: const Text('Options screen'),
            ),
            body: Center(
                child: SingleChildScrollView(
                    child: Column(
              children: [preferences, devices],
            )))));
  }
}

class KeyValueListWidget extends StatelessWidget {
  final MapNotifier model; // Define a Map to store key-value pairs
  final keyController =
      TextEditingController(); // Controller for the key text field
  final valueController =
      TextEditingController(); // Controller for the value text field

  KeyValueListWidget({super.key, required this.model});

  void _addKeyValue() {
    model.add(keyController.text, valueController.text);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListView.separated(
          shrinkWrap: true,
          itemCount: model.map.length,
          separatorBuilder: (_, __) => const Divider(),
          itemBuilder: (context, int index) {
            final key = model.map.keys.elementAt(index);
            final value = model.map[key];
            if (value == null) return SizedBox();
            return OptionTile(
              k: key,
              v: value,
              onDelete: () {
                model.deleteKey(key);
              },
            );
          },
        ),
        const Divider(),
        Row(
            // mainAxisSize: MainAxisSize.max,
            // mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: TextField(
                  controller: keyController,
                  maxLines: 1,
                  decoration: const InputDecoration(
                    labelText: 'Key',
                  ),
                ),
              ),
              Expanded(
                child: TextField(
                  controller: valueController,
                  maxLines: 1,
                  decoration: const InputDecoration(
                    labelText: 'Value',
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: _addKeyValue,
                child: const Text('Add'),
              )
            ]),
      ],
    );
  }
}

class OptionTile extends StatelessWidget {
  final String k;
  final String v;

  final VoidCallback onDelete;

  const OptionTile(
      {super.key, required this.k, required this.v, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
        child: Text(k),
      ),
      Expanded(
        child: Text(v),
      ),
      ElevatedButton(
        onPressed: () {
          onDelete();
        },
        child: const Text('Delete'),
      )
    ]);
  }
}

class LocationOptionsWidget extends StatelessWidget {
  final MapNotifier customAttributes;
  final MapNotifier customFilters;

  final valueController =
      TextEditingController(); // Controller for the value text field

  isValid() {
    return customAttributes.get("long") != null &&
        customAttributes.get("lat") != null;
  }

  canReset() {
    return customAttributes.get("long") != null ||
        customAttributes.get("lat") != null ||
        customFilters.get("dist") != null;
  }

  reset() {
    customAttributes.deleteKey('long');
    customAttributes.deleteKey('lat');
    customFilters.deleteKey('dist');
  }

  updateLocation() async {
    Position pos = await getLocation();
    customAttributes.add("long", pos.latitude.toString());
    customAttributes.add("lat", pos.longitude.toString());
    print("pos $pos ${pos.latitude} ${pos.longitude}");
  }

  LocationOptionsWidget(
      {super.key, required this.customAttributes, required this.customFilters});

  @override
  Widget build(BuildContext context) {
    Pair<double, double>? posPair;

    String? lat = customAttributes.get("lat");
    String? long = customAttributes.get("long");

    if (long != null && lat != null) {
      try {
        posPair = Pair(double.parse(long), double.parse(lat));
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    }

    double dist = -1;

    valueController.text = customFilters.get('dist') ?? 'None';

    if (customFilters.get('dist') != null) {
      print("customFilters.get('dist') is ${customFilters.get('dist')}");
      try {
        dist = double.parse(customFilters.get('dist')!);
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    } else {
      print("customFilters.get('dist') == null");
    }

    return Column(children: [
      Row(
        children: [
          ElevatedButton(
            onPressed: updateLocation,
            child: const Text('Update Location'),
          ),
          posPair != null
              ? Expanded(
                  child:
                      Text(' Long: ${posPair.first} - Lat: ${posPair.second} '))
              : Container(),
          Expanded(
              child: Text(isValid()
                  ? 'Max Distance Km: ${dist < 0 ? 'None' : dist.toInt()}'
                  : 'Max Distance (Enabled with \'Update Location\')')),
          ElevatedButton(
            onPressed: canReset() ? reset : null,
            child: const Text('Clear'),
          )
        ],
      ),
      posPair != null
          ? SizedBox(
              width: 300,
              height: 300,
              child: MapWidget(posPair, dist, true, (double eventDist) {
                print("updating dist value $eventDist");
                customFilters.add('dist', eventDist.toString(), notify: true);
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
  final MapNotifier preferenceMap;

  const DropDownPreference(
      {super.key,
      required this.label,
      required this.options,
      required this.preferenceMap,
      required this.mapKey});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
        width: 400,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("$label:"),
            SizedBox(
                child: DropdownButton<String>(
              value: preferenceMap.get(mapKey) ?? naValue,
              icon: const Icon(Icons.arrow_drop_down),
              elevation: 16,
              style: const TextStyle(color: Colors.purple),
              underline: Container(
                height: 2,
                color: Colors.purpleAccent,
              ),
              onChanged: (String? value) {
                preferenceMap.add(mapKey, value!);
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
        ));
  }
}
