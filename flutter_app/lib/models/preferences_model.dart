class Preferences {
  Map<String, String> constantAttributes = {};
  Map<String, String> constantFilters = {};
  Map<String, String> customAttributes = {};
  Map<String, String> customFilters = {};
  double priority = 0.0;

  Preferences() {}

  factory Preferences.fromJson(dynamic response) {
    Preferences preferences = Preferences();

    dynamic data = response;
    if (data["attributes"] is Map && data["attributes"]["constant"] is Map) {
      var temp = data["attributes"]["constant"] as Map;
      preferences.constantAttributes.addEntries(temp.entries.map((e) =>
          MapEntry<String, String>(e.key.toString(), e.value.toString())));
    }
    if (data["filters"] is Map && data["filters"]["constant"] is Map) {
      var temp = data["filters"]["constant"] as Map;
      preferences.constantFilters.addEntries(temp.entries.map((e) =>
          MapEntry<String, String>(e.key.toString(), e.value.toString())));
    }

    if (data["attributes"] is Map && data["attributes"]["custom"] is Map) {
      var temp = data["attributes"]["custom"] as Map;
      preferences.customAttributes.addEntries(temp.entries.map((e) =>
          MapEntry<String, String>(e.key.toString(), e.value.toString())));
    }
    if (data["filters"] is Map && data["filters"]["custom"] is Map) {
      var temp = data["filters"]["custom"] as Map;
      preferences.customFilters.addEntries(temp.entries.map((e) =>
          MapEntry<String, String>(e.key.toString(), e.value.toString())));
    }

    preferences.priority = data["priority"] as double;

    return preferences;
  }
}
