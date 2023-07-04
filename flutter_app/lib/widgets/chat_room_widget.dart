import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';

import '../controllers/chat_controller.dart';

class ChatRoom extends GetView<ChatController> {
  const ChatRoom(this.userId, {super.key});

  final String userId;

  @override
  Widget build(BuildContext context) {
    RxList chatList = controller.loadChat(userId);

    return Obx(() => Column(
          children: chatList()
                  // ignore: unnecessary_cast
                  .map((e) => Text(e.toString()) as Widget)
                  .toList() +
              [
                TextButton(
                  onPressed: () {
                    controller.sendMessage(userId, "tseting...");
                  },
                  child: const Text("SEND MSG"),
                )
              ],
        ));
  }
}
