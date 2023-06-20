// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

const String naValue = "Skip";

class DropDownPreference extends StatelessWidget {
  final bool enableNaValue;
  final String label;
  final String mapKey;
  final List<String> options;
  final Map<String, String> preferenceMap;

  const DropDownPreference(
      {super.key,
      required this.label,
      required this.options,
      required this.preferenceMap,
      required this.mapKey,
      required this.enableNaValue});

  List<String> getOptions() {
    if (enableNaValue) {
      return [naValue, ...options];
    } else {
      return options;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() => SizedBox(
            child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("$label:"),
            SizedBox(
                child: DropdownButton<String>(
              value: preferenceMap[mapKey] ?? naValue,
              icon: const Icon(Icons.arrow_drop_down),
              elevation: 16,
              style: TextStyle(color: Get.theme.primaryColor),
              underline: Container(height: 2, color: Get.theme.primaryColor),
              onChanged: (String? value) {
                if (value == naValue) {
                  preferenceMap.remove(mapKey);
                } else {
                  preferenceMap[mapKey] = value!;
                }
              },
              items: getOptions().map<DropdownMenuItem<String>>((String value) {
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
