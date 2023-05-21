// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'auth_service.dart';

class ApiService extends GetConnect {
  @override
  void onInit() {
    super.onInit();

    // httpClient.addAuthenticator((request) => null)
    httpClient.addRequestModifier<dynamic>((request) async {
      AuthService authService = Get.find<AuthService>();
      final token = await authService.getToken();

      request.headers['authorization'] = token;
      return request;
    });
  }
}
