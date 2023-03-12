import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'Factory.dart';

class MapNotifier extends ChangeNotifier {
  final Map<String, String> _map = {};

  Map<String, String> get map => _map;

  void addToMap(String key, String value) {
    _map[key] = value;
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

  @override
  void initState() {
    super.initState();
    attributesMap.addListener(() {
      setState(() {});
    });
    filtersMap.addListener(() {
      setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('Options screen'),
        ),
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            KeyValueListWidget(title: "Attributes", model: attributesMap),
            KeyValueListWidget(title: "Filters", model: filtersMap),
            SizedBox(
              height: 50,
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  var url = Uri.http(
                      Factory.getHostAddress(), 'options/updateattributes');
                  final headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    'authorization': await FirebaseAuth.instance.currentUser!
                        .getIdToken(true)
                  };
                  final body = {'constants': attributesMap.map};
                  var response = await http.put(url,
                      headers: headers, body: json.encode(body));
                  print('Feedback status: ${response.statusCode}');
                  print('Feedback body: ${response.body}');
                },
                child: const Text('Submit'),
              ),
            )
          ],
        ));
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
                if (value == null) return null;
                return ListTile(
                  title: Text(key),
                  subtitle: Text(value),
                );
              },
            ),
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
