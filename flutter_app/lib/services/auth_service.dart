import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../routes/app_pages.dart';

class AuthService extends GetxService {
  String? token;

  @override
  void onInit() {
    super.onInit();
  }

  ititToken() async {}

  Future<String> refreshToken() async {
    return "hi";
    // log('refresh-token');
    // var credentials = await loadCredentails();
    // try {
    //   if (credentials!.canRefresh) {
    //     var cre = await credentials.refresh(
    //         identifier: clientId, secret: clientSecret);

    //     await saveCredentails(cre);

    //     return cre;
    //   } else {
    //     throw 'Couuld not refresh the Token!';
    //   }
    // } catch (e) {
    //   printError(
    //       info:
    //           'Oauth client service exception refreshToken:  ${e.toString()}');
    //   throw 'Oauth client service exception refreshToken:  ${e.toString()}';
    // }
  }

  bool isAuthenticated() {
    return FirebaseAuth.instance.currentUser != null;
  }

  signOut() async {
    await FirebaseAuth.instance.signOut();
  }
}
