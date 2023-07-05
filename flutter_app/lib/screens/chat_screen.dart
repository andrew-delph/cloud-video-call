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
        body: const Center(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
              Text(
                "Chat",
                style: TextStyle(
                  fontSize: 35.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Divider(),
              Text("Left nav of recent chats. Open window for each chat.")
            ])));
  }
}
