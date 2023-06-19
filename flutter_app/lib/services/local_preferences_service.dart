// Package imports:
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class LocalPreferences extends GetxService {
  final autoQueue = true.obs;
  final feedbackPopup = false.obs;
  final swipeFeedback = false.obs;
  final videoDeviceLabel = 'Default'.obs;
  final audioDeviceLabel = 'Default'.obs;
  final fullscreen = false.obs;
  final isDarkMode = Get.isDarkMode.obs;

  @override
  Future<void> onInit() async {
    super.onInit();
    await GetStorage.init();
    GetStorage box = GetStorage();

    autoQueue.value = box.read('autoQueue') ?? autoQueue.value;
    ever(autoQueue, (value) => box.write('autoQueue', value));

    feedbackPopup.value = box.read('feedbackPopup') ?? feedbackPopup.value;
    ever(feedbackPopup, (value) => box.write('feedbackPopup', value));

    swipeFeedback.value = box.read('swipeFeedback') ?? swipeFeedback.value;
    ever(swipeFeedback, (value) => box.write('swipeFeedback', value));

    videoDeviceLabel.value =
        box.read('videoDeviceLabel') ?? videoDeviceLabel.value;
    ever(videoDeviceLabel, (value) => box.write('videoDeviceLabel', value));

    videoDeviceLabel.value =
        box.read('videoDeviceLabel') ?? videoDeviceLabel.value;
    ever(videoDeviceLabel, (value) => box.write('videoDeviceLabel', value));

    audioDeviceLabel.value =
        box.read('audioDeviceLabel') ?? audioDeviceLabel.value;
    ever(audioDeviceLabel, (value) => box.write('audioDeviceLabel', value));

    fullscreen.value = box.read('fullscreen') ?? fullscreen.value;
    ever(fullscreen, (value) => box.write('fullscreen', value));

    isDarkMode.value = box.read('isDarkMode') ?? isDarkMode.value;
    Get.changeTheme(isDarkMode() ? ThemeData.dark() : ThemeData.light());
    ever(isDarkMode, (value) {
      box.write('isDarkMode', value);
      Get.changeTheme(value ? ThemeData.dark() : ThemeData.light());
    });
  }
}
