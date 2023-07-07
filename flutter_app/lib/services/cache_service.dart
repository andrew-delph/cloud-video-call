// Package imports:
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:get/get.dart';

class CacheService extends GetxService {
  Map cache = <String, dynamic>{};

  T? get<T>(String key) {
    return cache[key];
  }

  T set<T>(String key, T value) {
    cache[key] = value;
    return value;
  }

  Future<T> getOrWrite<T>(String key, Future<T> Function() write) async {
    T? value = get(key);
    if (value == null) {
      print("not found in cache: $key");
      return set(key, await write());
    } else {
      print("found in cache: $key");
      return value;
    }
  }
}
