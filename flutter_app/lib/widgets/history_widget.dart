// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/widgets/profile_picture.dart';
import '../controllers/history_controller.dart';
import '../models/history_model.dart';
import '../models/user_model.dart';
import '../utils/utils.dart';
import 'chat_room_widget.dart';

// Package imports:

class HistoryWidget extends StatelessWidget {
  final HistoryModel? historyModel;
  const HistoryWidget({
    Key? key,
    required this.historyModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    List<StatelessWidget>? historyList =
        historyModel?.matchHistoryList.expand((historyItem) {
      return [
        HistoryItemWidget(
          historyItem: historyItem,
        ),
        const Divider()
      ];
    }).toList();

    return Column(
        children: historyList ?? [const Text("Error Loading History")]);
  }
}

enum RelationShipState { friends, blocked, pending, none }

class HistoryItemWidget extends GetView<HistoryController> {
  final HistoryItemModel historyItem;
  HistoryItemWidget({
    Key? key,
    required this.historyItem,
  }) : super(key: key);

  final Rx<UserDataModel?> userData = Rx(null);

  @override
  Widget build(BuildContext context) {
    print("build history");
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
    DateTime? parsedCreateTime = parseDateTime('${historyItem.createTime}');
    DateTime? parsedEndTime = parseDateTime('${historyItem.endTime}');

    DateTime currentTime = DateTime.now();
    String startTimeSinceString;
    if (parsedCreateTime == null) {
      startTimeSinceString = "Error parsing CreateTime";
    } else if (currentTime.difference(parsedCreateTime).inDays > 7) {
      startTimeSinceString =
          "${currentTime.difference(parsedCreateTime).inDays % 7} weeks";
    } else if (currentTime.difference(parsedCreateTime).inDays >= 1) {
      startTimeSinceString =
          "${currentTime.difference(parsedCreateTime).inDays} days";
    } else if (currentTime.difference(parsedCreateTime).inHours > 1) {
      startTimeSinceString =
          "${currentTime.difference(parsedCreateTime).inHours} hours";
    } else if (currentTime.difference(parsedCreateTime).inMinutes > 1) {
      startTimeSinceString =
          "${currentTime.difference(parsedCreateTime).inMinutes} mins";
    } else {
      startTimeSinceString =
          "${currentTime.difference(parsedCreateTime).inSeconds} seconds";
    }

    String lengthTimeSinceString;
    if (parsedCreateTime != null && parsedEndTime != null) {
      if (parsedEndTime.difference(parsedCreateTime).inMinutes == 0) {
        lengthTimeSinceString =
            "${parsedEndTime.difference(parsedCreateTime).inSeconds} secs";
      } else {
        lengthTimeSinceString =
            "${parsedEndTime.difference(parsedCreateTime).inMinutes} mins";
      }
    } else if (parsedCreateTime == null) {
      lengthTimeSinceString = "Error parsing CreateTime";
    } else if (parsedEndTime == null) {
      lengthTimeSinceString = "Error parsing EndTime";
    } else {
      lengthTimeSinceString = "Error";
    }

    controller
        .getUserData(historyItem.userId2!)
        .then((value) => userData(value));

    return Obx(() => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [Text("User: ${userData()?.displayName}")],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [Text("Description: ${userData()?.description}")],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [Text("time: $startTimeSinceString ago")],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [Text("length: $lengthTimeSinceString")],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [Text("relationShipState: $relationShipState")],
            ),
            if (relationShipState == RelationShipState.friends)
              ElevatedButton(
                onPressed: () async {
                  // Action to perform when the button is pressed
                  await controller.updateFeedback(historyItem.matchId!, 0);
                },
                child: const Text('Remove Friend'),
              ),
            if (relationShipState == RelationShipState.blocked)
              ElevatedButton(
                onPressed: () async {
                  // Action to perform when the button is pressed
                  print('Button Pressed');
                  await controller.updateFeedback(historyItem.matchId!, 0);
                },
                child: const Text('Unblock'),
              ),
            if (relationShipState == RelationShipState.pending)
              ElevatedButton(
                onPressed: () async {
                  // Action to perform when the button is pressed
                  print('Button Pressed');
                  await controller.updateFeedback(historyItem.matchId!, 0);
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
                      await controller.updateFeedback(historyItem.matchId!, 5);
                    },
                    child: const Text('Send Friend Request'),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      // Action to perform when the button is pressed
                      print('Button Pressed');
                      await controller.updateFeedback(historyItem.matchId!, -5);
                    },
                    child: const Text('Block'),
                  )
                ],
              ),
            ProfilePicture(historyItem.userId2!)
          ],
        ));
  }
}
