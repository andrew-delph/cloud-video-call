// Package imports:
import 'package:flutter_app/controllers/home_controller.dart';
import 'package:get/get.dart';

import '../models/chat_event_model.dart';
import '../services/auth_service.dart';
import '../services/options_service.dart';

// Project imports:

class ChatController extends GetxController {
  ChatController();

  final RxMap<String, RxList<ChatEventModel>> chatMap = RxMap();
  final OptionsService optionsService = Get.find();
  final AuthService authService = Get.find();

  appendChat(String userId, dynamic chatEvent) {
    RxList<ChatEventModel> chatRoom = loadChat(userId);

    chatRoom.add(chatEvent);
  }

  RxList<ChatEventModel> loadChat(String userId) {
    RxList<ChatEventModel> chatRoom = chatMap.putIfAbsent(userId, () {
      final HomeController homeController = Get.find();

      var newChatRoom = RxList<ChatEventModel>();

      optionsService.loadChat(userId).then((loadedMessages) {
        newChatRoom.addAll(loadedMessages);
        homeController.listenEvent("chat", (data) {
          ChatEventModel chatEvent = ChatEventModel.fromJson(data);

          if (chatEvent.source == userId) {
            newChatRoom.add(data);
            return "good";
          }
        });
      });

      return newChatRoom;
    });

    return chatRoom;
  }

  sendMessage(String target, String message) {
    final HomeController homeController = Get.find();

    ChatEventModel chatEvent = ChatEventModel(
        message: message, source: authService.getUser().uid, target: target);

    homeController.emitEvent("chat", chatEvent.toJson());
    loadChat(target).add(chatEvent);
  }
}
