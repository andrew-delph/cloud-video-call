import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';

import '../routes/app_pages.dart';

class AuthService extends GetxService {
  @override
  void onInit() {
    super.onInit();
  }

  Future<String> getToken() async {
    String? token = await FirebaseAuth.instance.currentUser?.getIdToken();

    if (token == null) {
      signOut();
      Get.offAllNamed(Routes.LOGIN);
      throw "Authentication Error";
    }
    return token;
  }

  bool isAuthenticated() {
    return FirebaseAuth.instance.currentUser != null;
  }

  signOut() async {
    await FirebaseAuth.instance.signOut();
  }
}
