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
    var paginationBar = Obx(() => Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.remove_circle),
              onPressed: () {
                controller.prevPage();
              },
            ),
            Text("Page: ${controller.page()}"),
            IconButton(
              icon: const Icon(Icons.add_circle),
              onPressed: () {
                controller.nextPage();
              },
            ),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                controller.loadHistory();
              },
            ),
          ],
        ));
    return AppMenu(
        title: 'History',
        body: SingleChildScrollView(
            child: Center(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
            const Text(
              "History",
              style: TextStyle(
                fontSize: 35.0,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            controller.obx(
              (state) => Obx(() => Column(children: [
                    paginationBar,
                    const Divider(),
                    HistoryWidget(historyModel: controller.historyModel())
                  ])),
              onLoading: const CircularProgressIndicator(),
              onError: (error) => Column(
                children: [
                  const Text("History Error."),
                  Text('$error'),
                ],
              ),
              onEmpty: Column(
                children: [
                  paginationBar,
                  const Divider(),
                  const Text("No History."),
                ],
              ),
            )
          ]),
        )));
  }
}
