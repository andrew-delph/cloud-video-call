import 'package:shared_preferences/shared_preferences.dart';

bool validStatusCode(int? statusCode) {
  return statusCode != null && statusCode >= 200 && statusCode < 300;
}

class Pair<T1, T2> {
  final T1 first;
  final T2 second;

  Pair(this.first, this.second);
}

class ErrorDetails {
  String title;
  String message;

  ErrorDetails(this.title, this.message);
}

class Options {
  SharedPreferences prefs;

  Options(this.prefs);

  static Future<Options> getOptions() async {
    return Options(await SharedPreferences.getInstance());
  }

  String? getString(String key) {
    return prefs.getString(key);
  }

  Future<bool> setString(String key, String value) {
    return prefs.setString(key, value);
  }

  Future<bool> setAudioDevice(String device) {
    return setString('audioDeviceLabel', device);
  }

  String? getAudioDevice() {
    return getString('audioDeviceLabel');
  }

  Future<bool> setVideoDevice(String device) {
    return setString('videoDeviceLabel', device);
  }

  String? getVideoDevice() {
    return getString('videoDeviceLabel');
  }

  Future<bool> setConfirmFeedbackPopup(bool flag) {
    return setString('videoDeviceLabel', flag ? 'true' : 'false');
  }

  bool getConfirmFeedbackPopup() {
    return getString('videoDeviceLabel') != 'false';
  }

  Future<bool> setAutoQueue(bool flag) {
    return setString('autoQueue', flag ? 'true' : 'false');
  }

  bool getAutoQueue() {
    return getString('autoQueue') == 'true';
  }
}
