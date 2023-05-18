import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';

class AuthService extends GetxService {
  String? token;

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

  bool sessionIsEmpty() {
    if (token == null) return true;
    return false;
  }

  signOut() async {
    await FirebaseAuth.instance.signOut();
  }
}
