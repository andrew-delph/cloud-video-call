import 'package:flutter_app/utils/utils.dart';
import 'package:get/get.dart';

import 'options_service.dart';

class PreferencesService extends GetxController {
  final OptionsProvider optionsProvider = OptionsProvider();
  final RxMap<String, String> constantAttributes = <String, String>{}.obs;
  final RxMap<String, String> constantFilters = <String, String>{}.obs;
  final RxMap<String, String> customAttributes = <String, String>{}.obs;
  final RxMap<String, String> customFilters = <String, String>{}.obs;
  final RxDouble priority = (0.0).obs;
  RxBool unsavedChanges = false.obs;
  RxBool loading = false.obs;

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

  void updateLoading(bool flag) {
    loading.value = flag;
    unsavedChanges.refresh();
  }

  Future<void> loadAttributes() async {
    loading.update((val) {
      loading.value = true;
    });
    return optionsProvider.getPreferences().then((response) {
      Preferences? preferences = response.body;

      if (validStatusCode(response.statusCode) && preferences != null) {
      } else {
        String errorMsg = ('Failed to load preferences data.').toString();
        throw Exception(errorMsg);
      }

      constantAttributes.addAll(preferences.constantAttributes);
      constantFilters.addAll(preferences.constantFilters);
      customAttributes.addAll(preferences.customAttributes);
      customFilters.addAll(preferences.customFilters);
      priority.value = preferences.priority;

      unsavedChanges.update((val) {
        unsavedChanges.value = false;
      });

      loading.update((val) {
        loading.value = false;
      });
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
    loading.update((val) {
      loading.value = true;
    });
    return optionsProvider.updatePreferences(body).then((response) {
      if (validStatusCode(response.statusCode)) {
      } else {
        const String errorMsg = 'Failed to update preferences.';
        throw Exception(response.body.toString());
      }
    }).then((value) => loadAttributes());
  }
}
