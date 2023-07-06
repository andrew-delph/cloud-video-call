// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/chat_controller.dart';
import '../widgets/app_menu_widget.dart';

class ChatScreen extends GetView<ChatController> {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppMenu(
        title: 'Chat',
        body: SingleChildScrollView(
            child: Center(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
              const Text(
                "Chat",
                style: TextStyle(
                  fontSize: 35.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Divider(),
              Obx(() => Row(children: [
                    Column(
                      children: [
                        ...controller
                            .chatRooms()
                            .map((chatroom) => TextButton(
                                onPressed: () {
                                  controller.showChat(chatroom);
                                },
                                child: Text("${chatroom.target}")))
                            .toList(),
                      ],
                    ),
                    controller.obx(
                      (state) {
                        if (state != null) {
                          return Expanded(child: state);
                        } else {
                          return const Text("Select a chat room.");
                        }
                      },
                    )
                  ]))
            ]))));
  }
}
