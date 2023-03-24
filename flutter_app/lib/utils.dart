import 'package:flutter/cupertino.dart';

bool validStatusCode(int statusCode) {
  return statusCode >= 200 && statusCode < 300;
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
