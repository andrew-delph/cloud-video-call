// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/options_controller.dart';
import 'dropdown_preference_widget.dart';
import 'location_options.dart';

// Package imports:

class Preferences extends GetView<PreferencesController> {
  const Preferences({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return controller.obx(
        onLoading: const CircularProgressIndicator(),
        onError: (error) => Column(
              children: [
                const Text("Preferences Error."),
                Text('$error'),
                ElevatedButton(
                    onPressed: () {
                      controller.loadAttributes();
                    },
                    child: const Text("Reload."))
              ],
            ),
        (state) => (Container(
              alignment: Alignment.topCenter,
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
                          ),
                        ),
                        DropDownPreference(
                          enableNaValue: true,
                          label: 'Gender',
                          options: const ["Male", "Female", "Other"],
                          preferenceMap: controller.constantAttributes,
                          mapKey: 'gender',
                        ),
                        DropDownPreference(
                          enableNaValue: true,
                          label: 'Language',
                          options: const ["English", "French", "Other"],
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
                          ),
                        ),
                        DropDownPreference(
                          enableNaValue: true,
                          label: 'Gender',
                          options: const ["Male", "Female", "Other"],
                          preferenceMap: controller.constantFilters,
                          mapKey: 'gender',
                        ),
                        DropDownPreference(
                          enableNaValue: true,
                          label: 'Language',
                          options: const ["English", "French", "Other"],
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
                          ),
                        ),
                        LocationOptionsWidget(
                            customAttributes: controller.customAttributes,
                            customFilters: controller.customFilters),
                      ],
                    ),
                  ),
                ],
              ),
            )));
  }
}
