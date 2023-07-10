// Dart imports:

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/history_controller.dart';
import '../widgets/app_menu_widget.dart';
import '../widgets/history_widget.dart';

class HistoryScreen extends GetView<HistoryController> {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppMenu(
        title: 'History',
        body: SingleChildScrollView(
            child: Center(
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
              Column(
                children: [
                  const Divider(),
                  SingleChildScrollView(
                      scrollDirection: Axis.vertical,
                      child: Container(
                        color: Colors.brown,
                        height: 500,
                        child: HistoryWidget(),
                      ))
                  // controller.obx(
                  //   (state) => SingleChildScrollView(
                  //       scrollDirection: Axis.vertical,
                  //       child: Container(
                  //         color: Colors.brown,
                  //         height: 200,
                  //         child: HistoryWidget(),
                  //       )),
                  //   onLoading: const CircularProgressIndicator(),
                  //   onError: (error) => Column(
                  //     children: [
                  //       const Text("History Error."),
                  //       Text('$error'),
                  //     ],
                  //   ),
                  //   onEmpty: const Column(
                  //     children: [
                  //       Text("No History."),
                  //     ],
                  //   ),
                  // )
                ],
              )
            ]))));
  }
}
