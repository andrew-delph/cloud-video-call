import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_app/utils.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../../Factory.dart';
import '../../location.dart';
import '../LoadingWidget.dart';

class MapNotifier extends ChangeNotifier {
  final Map<String, String> _map = {};

  Map<String, String> get map => _map;

  void add(String key, String value) {
    _map[key] = value;
    notifyListeners();
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

  void deleteKey(String key) {
    _map.remove(key);
    notifyListeners();
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

  @override
  void initState() {
    super.initState();
    constantAttributes.addListener(() {
      setState(() {});
    });
    constantFilters.addListener(() {
      setState(() {});
    });

    customAttributes.addListener(() {
      setState(() {});
    });
    customFilters.addListener(() {
      setState(() {});
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
      if (validStatusCode(response.statusCode)) {
        return jsonDecode(response.body);
      } else {
        const String errorMsg = 'Failed to load preferences data.';
        const snackBar = SnackBar(
          content: Text(errorMsg),
        );

        ScaffoldMessenger.of(context).showSnackBar(snackBar);
        Navigator.of(context).pop();
        throw Exception(errorMsg);
      }
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
        customFilters.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
    }).whenComplete(() {
      setState(() {
        loading = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body = connectingWidget;
    if (!loading) {
      body = Container(
          alignment: Alignment.topCenter,
          decoration: BoxDecoration(
            color: Colors.blue,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.all(20),
          constraints: const BoxConstraints(
            maxWidth: 1000,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              KeyValueListWidget(
                  title: "Attributes", model: constantAttributes),
              KeyValueListWidget(title: "Filters", model: constantFilters),
              LocationOptionsWidget(
                  customAttributes: customAttributes,
                  customFilters: customFilters,
                  title: "Location settings"),
              SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    var url =
                        Uri.parse("${Factory.getOptionsHost()}/preferences");
                    final headers = {
                      'Access-Control-Allow-Origin': '*',
                      'Content-Type': 'application/json',
                      'authorization':
                          await FirebaseAuth.instance.currentUser!.getIdToken()
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
                        .put(url, headers: headers, body: json.encode(body))
                        .then((response) {
                      if (validStatusCode(response.statusCode)) {
                      } else {
                        const String errorMsg = 'Failed to update preferences.';
                        const snackBar = SnackBar(
                          content: Text(errorMsg),
                        );

                        ScaffoldMessenger.of(context).showSnackBar(snackBar);
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

    return Scaffold(
        appBar: AppBar(
          title: const Text('Options screen'),
        ),
        body: Center(child: body));
  }
}

class KeyValueListWidget extends StatelessWidget {
  final String title;

  final MapNotifier model; // Define a Map to store key-value pairs
  final keyController =
      TextEditingController(); // Controller for the key text field
  final valueController =
      TextEditingController(); // Controller for the value text field

  KeyValueListWidget({super.key, required this.model, required this.title});

  void _addKeyValue() {
    model.add(keyController.text, valueController.text);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 24.0,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
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
        ));
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
  final String title;
  Position? pos;

  final MapNotifier customAttributes;
  final MapNotifier customFilters;

  final valueController =
      TextEditingController(); // Controller for the value text field

  isValid() {
    return customAttributes.get("long") != null &&
        customAttributes.get("lat") != null;
  }

  updateLocation() async {
    pos = await getLocation();
    customAttributes.add("long", pos!.latitude.toString());
    customAttributes.add("lat", pos!.longitude.toString());
    print("pos $pos ${pos!.latitude} ${pos!.longitude}");
  }

  LocationOptionsWidget(
      {super.key,
      required this.customAttributes,
      required this.customFilters,
      required this.title});

  @override
  Widget build(BuildContext context) {
    valueController.text = customFilters.get('dist') ?? '';
    return Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 24.0,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const Divider(),
            Row(children: [
              ElevatedButton(
                onPressed: updateLocation,
                child: const Text('Update Location'),
              ),
              Expanded(
                  child: Text(
                      ' Long: ${customAttributes.get("long") ?? 'None'} - Lat: ${customAttributes.get("lat") ?? 'None'} ')),
              Expanded(
                  child: TextField(
                enabled: isValid(),
                keyboardType: TextInputType.number,
                inputFormatters: <TextInputFormatter>[
                  FilteringTextInputFormatter.digitsOnly
                ],
                controller: valueController,
                onTapOutside: (PointerDownEvent event) {
                  print("setting dist: ${valueController.text}");
                  customFilters.add('dist', valueController.text);
                },
                maxLines: 1,
                decoration: InputDecoration(
                  labelText: isValid()
                      ? 'Max Distance Km'
                      : 'Max Distance (Enabled with \'Update Location\')',
                ),
              )),
            ]),
          ],
        ));
  }
}
