import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class LocalPreferences extends GetxService {
  final autoQueue = false.obs;
  final feedbackPopup = false.obs;
  final videoDeviceLabel = ''.obs;
  final audioDeviceLabel = ''.obs;

  @override
  Future<void> onInit() async {
    super.onInit();
    await GetStorage.init();
    GetStorage box = GetStorage();

    autoQueue.value = box.read('autoQueue') ?? autoQueue.value;
    ever(autoQueue, (value) => box.write('autoQueue', value));

    feedbackPopup.value = box.read('feedbackPopup') ?? feedbackPopup.value;
    ever(feedbackPopup, (value) => box.write('feedbackPopup', value));

    videoDeviceLabel.value =
        box.read('videoDeviceLabel') ?? videoDeviceLabel.value;
    ever(videoDeviceLabel, (value) => box.write('videoDeviceLabel', value));

    videoDeviceLabel.value =
        box.read('videoDeviceLabel') ?? videoDeviceLabel.value;
    ever(videoDeviceLabel, (value) => box.write('videoDeviceLabel', value));

    audioDeviceLabel.value =
        box.read('audioDeviceLabel') ?? audioDeviceLabel.value;
    ever(audioDeviceLabel, (value) => box.write('audioDeviceLabel', value));
  }
}
