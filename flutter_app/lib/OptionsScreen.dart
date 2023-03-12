import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class OptionsScreen extends StatefulWidget {
  const OptionsScreen({super.key});

  @override
  OptionsScreenState createState() => OptionsScreenState();
}

class OptionsScreenState extends State<OptionsScreen> {
  Map<String, String> attributesMap = {};
  Map<String, String> filtersMap = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('Options screen'),
        ),
        body: SingleChildScrollView(
            child: Column(
              children: const [KeyValueListWidget(), KeyValueListWidget()],
            )));
  }
}

class KeyValueListWidget extends StatefulWidget {
  const KeyValueListWidget({super.key});

  @override
  _KeyValueListWidgetState createState() => _KeyValueListWidgetState();
}

class _KeyValueListWidgetState extends State<KeyValueListWidget> {
  Map<String, String> keyValueMap = {}; // Define a Map to store key-value pairs
  final keyController =
  TextEditingController(); // Controller for the key text field
  final valueController =
  TextEditingController(); // Controller for the value text field

  void _addKeyValue() {
    // Method to add a new key-value pair to the Map
    setState(() {
      keyValueMap[keyController.text] = valueController.text;
      keyController.clear();
      valueController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            height: 50,
            width: 200,
            color: Colors.amber,
            child: const Text('Random widget'),
          ),
          ListView.separated(
            shrinkWrap: true,
            itemCount: keyValueMap.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, int index) {
              final key = keyValueMap.keys.elementAt(index);
              final value = keyValueMap[key] ?? "null";
              return ListTile(
                title: Text(key),
                subtitle: Text(value),
              );
            },
          ),
          Row(children: [
            SizedBox(
              height: 100,
              width: 100,
              child: TextField(
                controller: keyController,
                decoration: InputDecoration(
                  labelText: 'Key',
                ),
              ),
            ),
            SizedBox(
              height: 100,
              width: 100,
              child: TextField(
                controller: valueController,
                decoration: InputDecoration(
                  labelText: 'Value',
                ),
              ),
            ),
            SizedBox(
              height: 100,
              width: 100,
              child: ElevatedButton(
                onPressed: _addKeyValue,
                child: Text('Add'),
              ),
            ),
          ]),

        ],
      ),
    );
  }
}
