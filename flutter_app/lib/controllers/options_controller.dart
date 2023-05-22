// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/utils/utils.dart';
import '../models/preferences_model.dart';
import '../services/options_service.dart';

class PreferencesController extends GetxController with StateMixin {
  final OptionsService optionsService;
  final RxMap<String, String> constantAttributes = <String, String>{}.obs;
  final RxMap<String, String> constantFilters = <String, String>{}.obs;
  final RxMap<String, String> customAttributes = <String, String>{}.obs;
  final RxMap<String, String> customFilters = <String, String>{}.obs;
  final RxDouble priority = (0.0).obs;
  RxBool unsavedChanges = false.obs;

  PreferencesController(this.optionsService) {
    constantAttributes.listen((p0) {
      unsavedChanges(true);
    });
    constantFilters.listen((p0) {
      unsavedChanges(true);
    });
    customAttributes.listen((p0) {
      unsavedChanges(true);
    });
    customFilters.listen((p0) {
      unsavedChanges(true);
    });
  }

  @override
  onInit() {
    super.onInit();
    loadAttributes();
  }

  Future<void> loadAttributes() async {
    change(null, status: RxStatus.loading());
    return optionsService
        .getPreferences()
        .then((response) {
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
          priority(preferences.priority);
          unsavedChanges(false);
        })
        .then((value) => change(null, status: RxStatus.success()))
        .catchError(
            (error) => change(null, status: RxStatus.error(error.toString())));
  }

  Future<void> updateAttributes() {
    change(null, status: RxStatus.loading());
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
    return optionsService
        .updatePreferences(body)
        .then((response) {
          if (validStatusCode(response.statusCode)) {
          } else {
            const String errorMsg = 'Failed to update preferences.';
            throw Exception(response.body.toString());
          }
        })
        .then((value) => loadAttributes())
        .catchError(
            (error) => change(null, status: RxStatus.error(error.toString())));
  }
}
