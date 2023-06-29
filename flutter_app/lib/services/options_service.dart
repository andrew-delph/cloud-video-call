// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../config/factory.dart';
import '../models/history_model.dart';
import '../models/preferences_model.dart';
import 'api_service.dart';

class OptionsService extends ApiService {
  OptionsService() {
    httpClient.baseUrl = Factory.getOptionsHost();
  }

  Future<Response> health() => get('/health');

  Future<Response<Preferences>> getPreferences() => get('/preferences',
      contentType: 'application/json', decoder: Preferences.fromJson);

  Future<Response> updatePreferences(dynamic body) =>
      put('/preferences', body, contentType: 'application/json');

  Future<Response<HistoryModel>> getHistory(int page, int limit) {
    Map<String, String> query = {"page": "$page", "limit": "$limit"};
    return get('/history',
        query: query,
        contentType: 'application/json',
        decoder: HistoryModel.fromJson);
  }

  Future<Response> updateFeedback(dynamic body) =>
      post('/providefeedback', body, contentType: 'application/json');
}
