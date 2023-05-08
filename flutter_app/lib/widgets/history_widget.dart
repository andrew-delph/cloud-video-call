import 'package:flutter/material.dart';
import 'package:flutter_app/provider/options_provider.dart';

class HistoryWidget extends StatelessWidget {
  HistoryModel historyModel;
  HistoryWidget({
    Key? key,
    required this.historyModel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'History is working',
        style: TextStyle(fontSize: 20),
      ),
    );
  }
}
