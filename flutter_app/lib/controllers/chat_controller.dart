// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/controllers/home_controller.dart';
import 'package:socket_io_client/socket_io_client.dart';
import '../models/chat_event_model.dart';
import '../models/chat_room_model.dart';
import '../services/auth_service.dart';
import '../services/options_service.dart';
import '../widgets/chat_room_widget.dart';

// Project imports:

class ChatController extends GetxController with StateMixin<Widget> {
  final HomeController homeController;
  ChatController(this.homeController);

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

    homeController.socket.listenAndPump((socket) {
      bool connected = socket?.connected ?? false;
      print("chat controller socket.listen ${connected}");
      if (connected) {
        homeController.listenEvent("chat", (data) async {
          ChatEventModel chatEvent = ChatEventModel.fromJson(data);
          await updateChatRoom(getOther(chatEvent), false, true);
          return "good";
        });
      }
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

  Future<void> updateChatRoom(String target, bool read, bool updateTime) async {
    String source = authService.getUser().uid;

    chatRoomMap.update(target, (update) {
      update.read = read;
      if (updateTime) {
        update.latestChat = DateTime.now().millisecondsSinceEpoch;
      }
      return update;
    },
        ifAbsent: () => ChatRoomModel(
            source: source,
            target: target,
            latestChat: DateTime.now().millisecondsSinceEpoch,
            read: read));

    print("update $target read $read updateTime $updateTime");
  }

  String getOther(ChatEventModel chatEvent) {
    String userId = authService.getUser().uid;
    if (userId == chatEvent.target) {
      return chatEvent.source!;
    } else if (userId == chatEvent.source!) {
      return chatEvent.target!;
    } else {
      print("this should not happen!");
      return "???";
    }
  }

  RxList<ChatEventModel> loadChat(String userId) {
    RxList<ChatEventModel> chatRoom = chatMap.putIfAbsent(userId, () {
      var newChatRoom = RxList<ChatEventModel>();

      optionsService.loadChat(userId).then((loadedMessages) async {
        newChatRoom.addAll(loadedMessages);
        homeController.listenEvent("chat", (data) async {
          ChatEventModel chatEvent = ChatEventModel.fromJson(data);

          if (getOther(chatEvent) == userId) {
            newChatRoom.add(chatEvent);
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
    ChatEventModel chatEvent = ChatEventModel(
        message: message,
        source: authService.getUser().uid,
        target: chatroom.target!);

    homeController.emitEvent("chat", chatEvent.toJson());
    loadChat(chatroom.target!).add(chatEvent);
    await updateChatRoom(chatroom.target!, true, true);
  }
}
