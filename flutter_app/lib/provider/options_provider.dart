import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:get/get_connect/http/src/request/request.dart';

import '../utils/Factory.dart';

class OptionsProvider extends GetConnect {
  OptionsProvider() {
    httpClient.baseUrl = Factory.getOptionsHost();

    httpClient.addRequestModifier((Request request) async {
      final token = await FirebaseAuth.instance.currentUser!.getIdToken();

      // Set the header
      request.headers['authorization'] = token;
      return request;
    });

    httpClient.maxAuthRetries = 3;
  }

  Future<Response> health() => get('/health');

  Future<Response<Preferences>> getPreferences() => get('/preferences',
      contentType: 'application/json', decoder: Preferences.fromJson);

  Future<Response> updatePreferences(dynamic body) =>
      put('/preferences', body, contentType: 'application/json');

  Future<Response<History>> getHistory() => get('/history',
      contentType: 'application/json', decoder: History.fromJson);
}

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

class History {
  List<HistoryItem> matchHistoryList = [];

  History();

  factory History.fromJson(dynamic json) {
    History history = History();
    if (json['matchHistoryList'] != null) {
      json['matchHistoryList'].forEach((v) {
        history.matchHistoryList.add(HistoryItem.fromJson(v));
      });
    }
    return history;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['matchHistoryList'] = matchHistoryList.map((v) => v.toJson()).toList();
    return data;
  }
}

class HistoryItem {
  String? userId1;
  String? userId2;
  String? createTime;
  int? userId1Score;
  int? userId2Score;

  HistoryItem(
      {this.userId1,
      this.userId2,
      this.createTime,
      this.userId1Score,
      this.userId2Score});

  HistoryItem.fromJson(Map<String, dynamic> json) {
    userId1 = json['userId1'];
    userId2 = json['userId2'];
    createTime = json['createTime'];
    userId1Score = json['userId1Score'];
    userId2Score = json['userId2Score'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['userId1'] = userId1;
    data['userId2'] = userId2;
    data['createTime'] = createTime;
    data['userId1Score'] = userId1Score;
    data['userId2Score'] = userId2Score;
    return data;
  }
}
