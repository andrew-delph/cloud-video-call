import 'package:flutter/material.dart';
import 'package:flutter_app/provider/options_provider.dart';

class HistoryWidget extends StatelessWidget {
  const HistoryWidget({super.key});

  @override
  Widget build(BuildContext context) {
    OptionsProvider optionsProvider = OptionsProvider();
    return const Center(
      child: Text(
        'History is working',
        style: TextStyle(fontSize: 20),
      ),
    );
  }
}
