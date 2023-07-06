// Package imports:
import 'package:flutter/material.dart';
import 'package:flutter_app/utils/utils.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/controllers/home_controller.dart';
import '../models/chat_event_model.dart';
import '../models/chat_room_model.dart';
import '../services/auth_service.dart';
import '../services/options_service.dart';
import '../widgets/chat_room_widget.dart';

// Project imports:

class ChatController extends GetxController with StateMixin<Widget> {
  ChatController();

  RxList<ChatRoomModel> chatRooms = RxList();

  @override
  onInit() async {
    print("init ChatController");
    super.onInit();
    await loadChatRooms();
    change(null, status: RxStatus.success());
    // final HomeController homeController = Get.find();
    // homeController.listenEvent("chat", (data) {
    //   ChatEventModel chatEvent = ChatEventModel.fromJson(data);

    // });
  }

  final RxMap<String, RxList<ChatEventModel>> chatMap = RxMap();
  final OptionsService optionsService = Get.find();
  final AuthService authService = Get.find();

  appendChat(String userId, dynamic chatEvent) {
    RxList<ChatEventModel> chatRoom = loadChat(userId);

    chatRoom.add(chatEvent);
  }

  loadChatRooms() async {
    List<ChatRoomModel> chatRoomsReponse = await optionsService.loadChatRooms();

    chatRooms(chatRoomsReponse);

    print("chatRooms: $chatRooms");
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
            newChatRoom.add(chatEvent);
            return "good";
          }
        });
      });

      return newChatRoom;
    });

    return chatRoom;
  }

  showChat(ChatRoomModel chatroom) {
    change(ChatRoom(chatroom), status: RxStatus.success());
  }

  sendMessage(String target, String message) {
    final HomeController homeController = Get.find();

    ChatEventModel chatEvent = ChatEventModel(
        message: message, source: authService.getUser().uid, target: target);

    homeController.emitEvent("chat", chatEvent.toJson());
    loadChat(target).add(chatEvent);
  }
}
