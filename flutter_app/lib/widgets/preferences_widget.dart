// Flutter imports:
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_state_manager/src/simple/get_view.dart';

// Project imports:
import '../controllers/options_controller.dart';
import '../models/history_model.dart';
import '../screens/options_screen.dart';
import 'dropdown_preference_widget.dart';
import 'location_options.dart';

// Package imports:

class Preferences extends GetView<PreferencesController> {
  const Preferences({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
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
          children: [
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
                    preferenceMap: controller.constantAttributes,
                    mapKey: 'gender',
                  ),
                  DropDownPreference(
                    label: 'Language',
                    options: const [naValue, "English", "French", "Other"],
                    preferenceMap: controller.constantAttributes,
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
                    preferenceMap: controller.constantFilters,
                    mapKey: 'gender',
                  ),
                  DropDownPreference(
                    label: 'Language',
                    options: const [naValue, "English", "French", "Other"],
                    preferenceMap: controller.constantFilters,
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
                      customAttributes: controller.customAttributes,
                      customFilters: controller.customFilters),
                ],
              ),
            ),
            Obx(() {
              return SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: !controller.unsavedChanges()
                      ? null
                      : () async {
                          await controller.updateAttributes();
                          Get.snackbar(
                              'Updated', 'Preferences have been updated',
                              snackPosition: SnackPosition.BOTTOM);
                        },
                  child: const Text('Submit'),
                ),
              );
            })
          ],
        ));
  }
}
