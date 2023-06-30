// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../config/factory.dart';
import '../models/history_model.dart';
import '../models/preferences_model.dart';
import '../utils/utils.dart';
import 'api_service.dart';

class OptionsService extends ApiService {
  OptionsService() {
    httpClient.baseUrl = Factory.getOptionsHost();
  }

  Future<dynamic> health() =>
      get('/health').then((response) => validateRequestGetBody(response));

  Future<Preferences> getPreferences() => get('/preferences',
          contentType: 'application/json', decoder: Preferences.fromJson)
      .then((response) => validateRequestGetBody(response));

  Future<dynamic> updatePreferences(dynamic body) =>
      put('/preferences', body, contentType: 'application/json')
          .then((response) => validateRequestGetBody(response));

  Future<HistoryModel> getHistory(int page, int limit) {
    Map<String, String> query = {"page": "$page", "limit": "$limit"};
    return get('/history',
            query: query,
            contentType: 'application/json',
            decoder: HistoryModel.fromJson)
        .then((response) => validateRequestGetBody(response));
  }

  Future<dynamic> updateFeedback(dynamic body) =>
      post('/providefeedback', body, contentType: 'application/json')
          .then((response) => validateRequestGetBody(response));
}
