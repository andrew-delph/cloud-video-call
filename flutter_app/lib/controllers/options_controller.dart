// Package imports:
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_workers/utils/debouncer.dart';

// Project imports:
import 'package:flutter_app/utils/utils.dart';
import '../models/preferences_model.dart';
import '../services/auth_service.dart';
import '../services/options_service.dart';

class PreferencesController extends GetxController with StateMixin {
  final OptionsService optionsService;
  final RxMap<String, String> constantAttributes = <String, String>{}.obs;
  final RxMap<String, String> constantFilters = <String, String>{}.obs;
  final RxMap<String, String> customAttributes = <String, String>{}.obs;
  final RxMap<String, String> customFilters = <String, String>{}.obs;
  final RxDouble priority = (0.0).obs;
  final RxBool unsavedChanges = false.obs;
  final AuthService authService = Get.find();

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

    var updateDebouncer = Debouncer(delay: 1.seconds);
    unsavedChanges.listen((p0) {
      if (!status.isLoading) {
        change(null, status: RxStatus.loading());
        updateDebouncer.call(() => updateAttributes());
      }
    });
  }

  @override
  onInit() async {
    super.onInit();
    if (!authService.isAuthenticated()) {
      change(null, status: RxStatus.success());
      return;
    }
    await loadAttributes();
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
