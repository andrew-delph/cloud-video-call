import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_app/utils/utils.dart';
import 'package:get/get.dart';
import 'package:get/get_connect/http/src/request/request.dart';
import 'package:http/http.dart' as http;

import '../provider/options_provider.dart';
import '../utils/Factory.dart';

class PreferencesService extends GetxController {
  final OptionsProvider optionsProvider = OptionsProvider();
  final RxMap<String, String> constantAttributes = <String, String>{}.obs;
  final RxMap<String, String> constantFilters = <String, String>{}.obs;
  final RxMap<String, String> customAttributes = <String, String>{}.obs;
  final RxMap<String, String> customFilters = <String, String>{}.obs;
  final RxDouble priority = (0.0).obs;
  RxBool unsavedChanges = false.obs;

  PreferencesService() {
    constantAttributes.listen((p0) {
      updateChanges(true);
    });
    constantFilters.listen((p0) {
      updateChanges(true);
    });
    customAttributes.listen((p0) {
      updateChanges(true);
    });
    customFilters.listen((p0) {
      updateChanges(true);
    });
    priority.listen((p0) {
      updateChanges(true);
    });
  }

  void updateChanges(bool flag) {
    unsavedChanges.value = flag;
    unsavedChanges.refresh();
  }

  Future<void> loadAttributes() async {
    return optionsProvider.getPreferences().then((response) {
      dynamic data = response.body;
      if (validStatusCode(response.statusCode)) {
      } else {
        String errorMsg =
            (data['message'] ?? 'Failed to load preferences data.').toString();
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
        customFilters.addEntries(temp.entries.map((e) =>
            MapEntry<String, String>(e.key.toString(), e.value.toString())));
      }

      priority.value = data["priority"] as double;

      updateChanges(false);
    });
  }

  Future<void> updateAttributes() {
    final body = {
      'attributes': {
        'constant': constantAttributes,
        'custom': customAttributes
      },
      'filters': {
        'constant': constantFilters,
        'custom': customFilters,
      }
    };
    return optionsProvider.updatePreferences(body).then((response) {
      if (validStatusCode(response.statusCode)) {
      } else {
        const String errorMsg = 'Failed to update preferences.';
        throw Exception(response.body.toString());
      }
    }).then((value) => loadAttributes());
  }
}
