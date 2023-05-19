import 'package:flutter/material.dart';
import 'package:flutter_app/controllers/options_controller.dart';
import 'package:flutter_app/services/options_service.dart';
import 'package:get/get.dart';

import '../models/history_model.dart';

class HistoryWidget extends StatelessWidget {
  OptionsController optionsController = Get.find();
  HistoryWidget({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      HistoryModel? historyModel = optionsController.historyModel.value;

      if (historyModel == null) return const Text("Loading history...");

      List<Widget> historyList =
          historyModel.matchHistoryList.expand((historyItem) {
        return [
          HistoryItemWidget(
            historyItem: historyItem,
          ),
          const Divider()
        ];
      }).toList();

      // remove the last divider
      if (historyList.isNotEmpty) {
        historyList.removeLast();
      } else {
        return const Text("No History...");
      }

      return Column(children: historyList);
    });
  }
}

class HistoryItemWidget extends StatelessWidget {
  final HistoryItemModel historyItem;
  const HistoryItemWidget({
    Key? key,
    required this.historyItem,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("userId1: ${historyItem.userId1}"),
            Text("userId2: ${historyItem.userId2}")
          ],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("userId1Score: ${historyItem.userId1Score}"),
            Text("userId2Score: ${historyItem.userId2Score}")
          ],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("time: ${historyItem.createTime}")],
        ),
      ],
    );
  }
}
