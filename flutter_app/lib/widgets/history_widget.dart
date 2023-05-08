import 'package:flutter/material.dart';
import 'package:flutter_app/provider/options_provider.dart';
import 'package:get/get.dart';

class HistoryWidget extends StatelessWidget {
  Rx<HistoryModel> historyModel = HistoryModel().obs;

  OptionsProvider optionsProvider = OptionsProvider();
  HistoryWidget({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    optionsProvider.getHistory().then((value) {
      historyModel.value = value.body!;
    });

    return Obx(() {
      List<Widget> historyList =
          historyModel.value.matchHistoryList.expand((historyItem) {
        return [
          HistoryItemWidget(
            historyItem: historyItem,
          ),
          const Divider()
        ];
      }).toList();

      // remove the last divider
      historyList.removeLast();

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
