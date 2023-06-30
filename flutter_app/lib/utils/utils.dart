import 'package:flutter/material.dart';
import 'package:get/get.dart';

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

void errorSnackbar(String title, String message) {
  Get.snackbar(
    title,
    message,
    snackPosition: SnackPosition.TOP,
    backgroundColor: Colors.red.withOpacity(.75),
    colorText: Colors.white,
    icon: const Icon(Icons.error, color: Colors.white),
    shouldIconPulse: true,
    barBlur: 20,
  );
}

void infoSnackbar(String title, String message) {
  Get.snackbar(title, message);
}
