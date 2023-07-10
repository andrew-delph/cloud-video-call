// Package imports:
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
    if (!cache.containsKey(key)) {
      print("not found in cache: $key");
      return set(key, await write());
    } else {
      print("found in cache: $key");
      return get(key);
    }
  }
}
