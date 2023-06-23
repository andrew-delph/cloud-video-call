// Flutter imports:
import 'package:flutter/material.dart';

// Project imports:
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

enum RelationShipState {
  friends,
  blocked,
  none,
}

class HistoryItemWidget extends StatelessWidget {
  final HistoryItemModel historyItem;
  const HistoryItemWidget({
    Key? key,
    required this.historyItem,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    RelationShipState relationShipState;
    if (historyItem.negative ?? false) {
      relationShipState = RelationShipState.blocked;
    } else if (historyItem.friends ?? false) {
      relationShipState = RelationShipState.friends;
    } else {
      relationShipState = RelationShipState.none;
    }
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
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("friends: ${historyItem.friends}")],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("negative: ${historyItem.negative}")],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [Text("relationShipState: $relationShipState")],
        ),
        if (relationShipState == RelationShipState.friends)
          ElevatedButton(
            onPressed: () {
              // Action to perform when the button is pressed
              print('Button Pressed');
            },
            child: Text('Remove Friend'),
          ),
        if (relationShipState == RelationShipState.blocked)
          ElevatedButton(
            onPressed: () {
              // Action to perform when the button is pressed
              print('Button Pressed');
            },
            child: Text('Unblock'),
          ),
        if (relationShipState == RelationShipState.none)
          ElevatedButton(
            onPressed: () {
              // Action to perform when the button is pressed
              print('Button Pressed');
            },
            child: Text('Send Friend Request'),
          )
      ],
    );
  }
}
