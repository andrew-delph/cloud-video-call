// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

const String naValue = "Skip";

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
