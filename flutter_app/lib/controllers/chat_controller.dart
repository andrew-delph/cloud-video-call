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

  final OptionsService optionsService = Get.find();
  final AuthService authService = Get.find();

  final RxMap<String, ChatRoomModel> chatRoomMap = RxMap();
  final RxMap<String, RxList<ChatEventModel>> chatMap = RxMap();

  @override
  onInit() async {
    print("init ChatController");
    super.onInit();
    loadChatRooms();
    change(null, status: RxStatus.success());

    final HomeController homeController = Get.find();
    homeController.listenEvent("chat", (data) async {
      ChatEventModel chatEvent = ChatEventModel.fromJson(data);
      await updateChatRoom(chatEvent);
    });
  }

  void appendChat(String userId, dynamic chatEvent) {
    RxList<ChatEventModel> chatRoom = loadChat(userId);

    chatRoom.add(chatEvent);
  }

  void loadChatRooms() async {
    List<ChatRoomModel> chatRoomsReponse = await optionsService.loadChatRooms();

    chatRoomMap.addEntries(chatRoomsReponse
        .map((chatroom) => MapEntry(chatroom.target!, chatroom)));
  }

  Future<void> updateChatRoom(ChatEventModel chatEvent) async {
    ChatRoomModel chatroom = ChatRoomModel(
        source: chatEvent.source!,
        target: chatEvent.target!,
        latestChat: DateTime.now().toString(),
        read: false);

    String userId = authService.getUser().uid;

    if (userId == chatroom.target) {
      chatRoomMap.addEntries([MapEntry(chatroom.source!, chatroom)]);
    } else if (userId == chatroom.source) {
      chatRoomMap.addEntries([MapEntry(chatroom.target!, chatroom)]);
    }
  }

  RxList<ChatEventModel> loadChat(String userId) {
    RxList<ChatEventModel> chatRoom = chatMap.putIfAbsent(userId, () {
      final HomeController homeController = Get.find();

      var newChatRoom = RxList<ChatEventModel>();

      optionsService.loadChat(userId).then((loadedMessages) {
        newChatRoom.addAll(loadedMessages);
        homeController.listenEvent("chat", (data) async {
          ChatEventModel chatEvent = ChatEventModel.fromJson(data);

          if (chatEvent.source == userId) {
            newChatRoom.add(chatEvent);
            await updateChatRoom(chatEvent);
            return "good";
          }
        });
      });

      return newChatRoom;
    });

    return chatRoom;
  }

  void showChat(ChatRoomModel chatroom) {
    change(ChatRoom(chatroom), status: RxStatus.success());
  }

  Future<void> sendMessage(ChatRoomModel chatroom, String message) async {
    final HomeController homeController = Get.find();

    ChatEventModel chatEvent = ChatEventModel(
        message: message,
        source: authService.getUser().uid,
        target: chatroom.target!);

    homeController.emitEvent("chat", chatEvent.toJson());
    loadChat(chatroom.target!).add(chatEvent);
    await updateChatRoom(chatEvent);
  }
}
