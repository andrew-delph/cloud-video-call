// Package imports:
import 'package:flutter_app/controllers/home_controller.dart';
import 'package:get/get.dart';

import '../services/auth_service.dart';
import '../services/options_service.dart';

// Project imports:

class ChatController extends GetxController {
  ChatController();

  final RxMap chatMap = RxMap();
  final OptionsService optionsService = Get.find();
  final AuthService authService = Get.find();

  appendChat(String userId, dynamic chatEvent) {
    RxList chatRoom = loadChat(userId);

    chatRoom.add(chatEvent);
  }

  RxList loadChat(String userId) {
    chatMap.putIfAbsent(userId, () {
      final HomeController homeController = Get.find();

      var temp = RxList();

      optionsService.loadChat(userId).then((response) {
        List loadedMessages = response["chatMessages"] ?? [];

        print("loadedMessages ${loadedMessages.length}");

        temp.addAll(loadedMessages);
        homeController.listenEvent("chat", (data) {
          String source = data["source"];
          String target = data["target"];

          if (source == userId) {
            temp.add(data);
            return "good";
          }
        });
      });

      return temp;
    });

    RxList chatRoom = chatMap[userId];

    return chatRoom;
  }

  sendMessage(String userId, String message) {
    final HomeController homeController = Get.find();

    dynamic chatEvent = {
      "source": authService.getUser().uid,
      "target": userId,
      "message": message,
    };

    homeController.emitEvent("chat", chatEvent);
  }
}
