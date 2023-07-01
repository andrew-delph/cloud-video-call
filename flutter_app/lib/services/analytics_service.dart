// FirebaseAnalytics analytics = FirebaseAnalytics.instance;

// FirebaseAnalyticsObserver observer =
//     FirebaseAnalyticsObserver(analytics: analytics);

// Package imports:
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:get/get.dart';

class AnalyticsService extends GetxService {
  FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  FirebaseAnalyticsObserver observer =
      FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance);
}
