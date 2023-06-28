// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/widgets/profile_picture.dart';
import '../controllers/history_controller.dart';
import '../models/history_model.dart';

// Package imports:

class HistoryWidget extends StatelessWidget {
  final HistoryModel historyModel;
  const HistoryWidget({
    Key? key,
    required this.historyModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    List<Widget> historyList =
        historyModel.matchHistoryList.expand((historyItem) {
      return [
        HistoryItemWidget(
          historyItem: historyItem,
        ),
        const Divider()
      ];
    }).toList();

    return Column(children: historyList);
  }
}

enum RelationShipState { friends, blocked, pending, none }

class HistoryItemWidget extends GetView<HistoryController> {
  final HistoryItemModel historyItem;
  const HistoryItemWidget({
    Key? key,
    required this.historyItem,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    RelationShipState relationShipState;
    if ((historyItem.userId1Score ?? 1) < 0) {
      relationShipState = RelationShipState.blocked;
    } else if (historyItem.friends ?? false) {
      relationShipState = RelationShipState.friends;
    } else if ((historyItem.userId1Score ?? -1) > 0) {
      relationShipState = RelationShipState.pending;
    } else {
      relationShipState = RelationShipState.none;
    }

    DateTime parsedTime = DateTime.parse('${historyItem.createTime}');
    DateTime currentTime = DateTime.now();
    String timeValue =
        "${currentTime.difference(parsedTime).inSeconds} seconds";
    if (currentTime.difference(parsedTime).inDays > 7) {
      timeValue = "${currentTime.difference(parsedTime).inDays % 7} weeks";
    } else if (currentTime.difference(parsedTime).inDays >= 1) {
      timeValue = "${currentTime.difference(parsedTime).inDays} days";
    } else if (currentTime.difference(parsedTime).inHours > 1) {
      timeValue = "${currentTime.difference(parsedTime).inHours} hours";
    } else if (currentTime.difference(parsedTime).inMinutes > 1) {
      timeValue = "${currentTime.difference(parsedTime).inMinutes} mins";
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("User: ${historyItem.userId2}")],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("time: $timeValue ago")],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("relationShipState: $relationShipState")],
        ),
        if (relationShipState == RelationShipState.friends)
          ElevatedButton(
            onPressed: () async {
              // Action to perform when the button is pressed
              await controller.updateFeedback(historyItem.feedbackId!, 0);
            },
            child: const Text('Remove Friend'),
          ),
        if (relationShipState == RelationShipState.blocked)
          ElevatedButton(
            onPressed: () async {
              // Action to perform when the button is pressed
              print('Button Pressed');
              await controller.updateFeedback(historyItem.feedbackId!, 0);
            },
            child: const Text('Unblock'),
          ),
        if (relationShipState == RelationShipState.pending)
          ElevatedButton(
            onPressed: () async {
              // Action to perform when the button is pressed
              print('Button Pressed');
              await controller.updateFeedback(historyItem.feedbackId!, 0);
            },
            child: const Text('Cancel Friend Request'),
          ),
        if (relationShipState == RelationShipState.none)
          Row(
            children: [
              ElevatedButton(
                onPressed: () async {
                  // Action to perform when the button is pressed
                  print('Button Pressed');
                  await controller.updateFeedback(historyItem.feedbackId!, 5);
                },
                child: const Text('Send Friend Request'),
              ),
              ElevatedButton(
                onPressed: () async {
                  // Action to perform when the button is pressed
                  print('Button Pressed');
                  await controller.updateFeedback(historyItem.feedbackId!, -5);
                },
                child: const Text('Block'),
              )
            ],
          ),
        ProfilePicture(historyItem.userId2!)
      ],
    );
  }
}
