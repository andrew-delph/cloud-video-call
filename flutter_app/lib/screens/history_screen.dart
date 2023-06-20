// Dart imports:

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/history_controller.dart';
import '../widgets/history_widget.dart';
import '../widgets/app_menu_widget.dart';

class HistoryScreen extends GetView<HistoryController> {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppMenu(
        title: 'History',
        body: controller.obx(
          (state) => SingleChildScrollView(
              child: Center(
                  child: Column(
            children: [
              Container(
                  alignment: Alignment.topCenter,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(20),
                  margin: const EdgeInsets.all(20),
                  constraints: const BoxConstraints(
                    maxWidth: 1000,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        "History",
                        style: TextStyle(
                          fontSize: 35.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Divider(),
                      HistoryWidget(historyModel: controller.historyModel())
                    ],
                  ))
            ],
          ))),
          onLoading: const CircularProgressIndicator(),
          onError: (error) => Column(
            children: [
              const Text("History Error."),
              Text('$error'),
            ],
          ),
          onEmpty: Column(
            children: const [
              Text("No History."),
            ],
          ),
        ));
  }
}
