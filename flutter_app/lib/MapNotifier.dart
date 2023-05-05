import 'package:flutter/cupertino.dart';

const String naValue = "Skip";

class MapNotifier extends ChangeNotifier {
  final Map<String, String> _map = {};

  Map<String, String> get map => _map;

  void add(String key, String value, {bool notify = true}) {
    String? preValue = _map[key];
    if (value == naValue || value == "") {
      _map.remove(key);
    } else {
      _map[key] = value;
    }
    if (notify && preValue != value) {
      notifyListeners();
    }
  }

  String? get(String key) {
    return _map[key];
  }

  void addAll(Map<String, String> toAdd) {
    _map.addAll(toAdd);
    notifyListeners();
  }

  void addEntries(Iterable<MapEntry<String, String>> mapEntryList) {
    _map.addEntries(mapEntryList);
    notifyListeners();
  }

  void deleteKey(String key, {bool notify = true}) {
    String? preValue = _map[key];
    _map.remove(key);
    if (notify && preValue != null) {
      notifyListeners();
    }
  }
}
