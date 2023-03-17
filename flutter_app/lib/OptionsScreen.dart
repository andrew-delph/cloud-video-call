import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'Factory.dart';
import 'LoadingWidget.dart';

class MapNotifier extends ChangeNotifier {
  final Map<String, String> _map = {};

  Map<String, String> get map => _map;

  void addToMap(String key, String value) {
    _map[key] = value;
    notifyListeners();
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
  final MapNotifier attributes = MapNotifier();
  final MapNotifier filters = MapNotifier();

  OptionsScreen({super.key});

  @override
  OptionsScreenState createState() => OptionsScreenState();
}

class OptionsScreenState extends State<OptionsScreen> {
  final MapNotifier attributesMap = MapNotifier();
  final MapNotifier filtersMap = MapNotifier();

  bool loading = true;

  @override
  void initState() {
    super.initState();
    attributesMap.addListener(() {
      setState(() {});
    });
    filtersMap.addListener(() {
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
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to fetch data');
      }
    }).then((data) {
      if (data["attributes"] is Map && data["attributes"]["constant"] is Map) {
        var temp = data["attributes"]["constant"] as Map;
        attributesMap.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
      if (data["filters"] is Map && data["filters"]["constant"] is Map) {
        var temp = data["filters"]["constant"] as Map;
        filtersMap.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }
      setState(() {
        loading = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget body = loadingWidget;
    if (!loading) {
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          KeyValueListWidget(title: "Attributes", model: attributesMap),
          KeyValueListWidget(title: "Filters", model: filtersMap),
          SizedBox(
            height: 50,
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                var url = Uri.parse("${Factory.getOptionsHost()}/preferences");
                final headers = {
                  'Access-Control-Allow-Origin': '*',
                  'Content-Type': 'application/json',
                  'authorization':
                      await FirebaseAuth.instance.currentUser!.getIdToken()
                };
                final body = {
                  'attributes': {'constant': attributesMap.map},
                  'filters': {'constant': filtersMap.map}
                };
                var response = await http.put(url,
                    headers: headers, body: json.encode(body));
                print('preferences status: ${response.statusCode}');
                loadAttributes();
              },
              child: const Text('Submit'),
            ),
          )
        ],
      );
    }

    return Scaffold(
        appBar: AppBar(
          title: const Text('Options screen'),
        ),
        body: body);
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
    model.addToMap(keyController.text, valueController.text);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        color: Colors.blue,
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
