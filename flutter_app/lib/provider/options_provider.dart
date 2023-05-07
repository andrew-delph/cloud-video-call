import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:get/get_connect/http/src/request/request.dart';

import '../utils/Factory.dart';

class OptionsProvider extends GetConnect {
  OptionsProvider() {
    httpClient.baseUrl = Factory.getOptionsHost();

    httpClient.addAuthenticator((Request request) async {
      final token = await FirebaseAuth.instance.currentUser!.getIdToken();
      // Set the header
      request.headers['Authorization'] = token;
      return request;
    });

    httpClient.maxAuthRetries = 3;
  }

  Future<Response> health() => get('/health');

  Future<Response> getPreferences() =>
      get('/preferences', contentType: 'application/json');

  Future<Response> updatePreferences(dynamic body) =>
      put('/preferences', body, contentType: 'application/json');
}
