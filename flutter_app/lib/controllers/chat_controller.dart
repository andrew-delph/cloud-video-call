// Flutter imports:
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

// Package imports:
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
    change(null, status: RxStatus.loading());

    homeController.socket.listenAndPump((socket) {
      bool connected = socket?.connected ?? false;
      print("chat controller socket.listen $connected");
      if (connected) {
        loadChatRooms()
            .then((value) => change(null, status: RxStatus.success()))
            .catchError((err) {
          change(null, status: RxStatus.error("$err"));
        });
        homeController.listenEvent("chat", (data) async {
          ChatEventModel chatEvent = ChatEventModel.fromJson(data);
          await updateChatRoom(getOther(chatEvent), false, true);
        });
        homeController.listenEvent("chat:active", (data) async {
          bool? active = data["active"];
          String? target = data["target"];
          if (target == null || active == null) {
            print("missing values target $target active $active");
            return;
          }
          await updateChatRoomActive(target, active);
        });
      }
    });
  }

  void appendChat(String userId, dynamic chatEvent) {
    RxList<ChatEventModel> chatRoom = loadChat(userId);

    chatRoom.add(chatEvent);
  }

  Future<void> loadChatRooms() async {
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

  Future<void> updateChatRoomActive(String target, bool active) async {
    if (chatRoomMap.containsKey(target)) {
      chatRoomMap.update(target, (update) {
        update.active = active;
        return update;
      });
      print("updateChatRoomActive target $target active $active");
    } else {
      print("updateChatRoomActive doesnt exist target $target active $active");
    }
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
            if (Get.parameters['target'] == getOther(chatEvent)) {
              return "good";
            }
          }
        });
      });

      return newChatRoom;
    });

    return chatRoom;
  }

  Future<void> showChat(ChatRoomModel chatroom) async {
    if (chatroom.read == false) {
      await sendMessage(chatroom, null);
    }
    change(ChatRoom(chatroom), status: RxStatus.success());
    Get.parameters['target'] = chatroom.target;
  }

  Future<void> sendMessage(ChatRoomModel chatroom, String? message) async {
    if (message != null) message = message.trim();
    ChatEventModel chatEvent = ChatEventModel(
        message: message,
        source: authService.getUser().uid,
        target: chatroom.target!);

    homeController.emitEvent("chat", chatEvent.toJson());
    if (message?.isEmpty == false) {
      loadChat(chatroom.target!).add(chatEvent);
    }
    await updateChatRoom(chatroom.target!, true, true);
  }
}
