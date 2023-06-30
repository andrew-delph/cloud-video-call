// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

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

bool validStatusCode(int? statusCode) {
  return statusCode != null && statusCode >= 200 && statusCode < 300;
}

T validateRequestGetBody<T>(Response<T> response) {
  if (!validStatusCode(response.statusCode)) {
    throw "Invalid status code ${response.statusCode}";
  }
  T? body = response.body;
  if (body == null) {
    throw "Body is null";
  }
  return body;
}
