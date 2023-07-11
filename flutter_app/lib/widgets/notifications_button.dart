// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/models/notification_model.dart';
import '../controllers/notifications_controller.dart';

class NotificationsButton extends GetView<NotificationsController> {
  const NotificationsButton({super.key});

  OverlayEntry _createOverlayEntry() {
    OverlayEntry? overlay;
    final ScrollController scrollController = ScrollController();
    // scrollController.addListener(() async {
    //   print(
    //       "scroll position ${scrollController.position.pixels} ${scrollController.position.maxScrollExtent} ${scrollController.position.pixels == scrollController.position.maxScrollExtent}");
    //   if (scrollController.position.pixels ==
    //       scrollController.position.maxScrollExtent) {
    //     // await controller.loadMoreNotifications();
    //   }
    // });

    Set<String> seenNotifications = {};

    overlay = OverlayEntry(
        builder: (context) => Stack(children: [
              // This Positioned.fill covers the entire screen with a translucent color
              Positioned.fill(
                child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () async {
                      await controller
                          .readNotifications(seenNotifications.toList());
                      overlay?.remove();
                    },
                    child: Container(color: Colors.transparent)),
              ),
              // The actual overlay content
              Positioned(
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 200,
                  child: Material(
                    color: Colors.cyan,
                    child: Column(children: [
                      Expanded(
                          child: Obx(() => ListView.builder(
                              controller: scrollController,
                              itemCount:
                                  controller.notificationsList().length + 1,
                              itemBuilder: (BuildContext context, int index) {
                                if (index == controller.notificationTotal()) {
                                  return const Text("No more Notifications.");
                                } else if (index >=
                                    controller.notificationsList().length) {
                                  controller.loadMoreNotifications();
                                  return const CircularProgressIndicator();
                                } else {
                                  String notificationId =
                                      controller.notificationsList()[index].key;
                                  NotificationModel notification = controller
                                      .notificationsList()[index]
                                      .value;

                                  seenNotifications.add(notificationId);
                                  return NotificationItem(
                                      notificationId, notification);
                                }
                              }))),
                      const Divider(),
                      TextButton(
                          onPressed: () async {
                            await controller.archiveNotifications(
                                seenNotifications.toList());
                          },
                          child: const Text("Archive notifications."))
                    ]),
                  )),
            ]));
    return overlay;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Obx(() {
          return IconButton(
            icon: Badge(
              label: Text(controller.unread.toString()),
              isLabelVisible: controller.unread() > 0,
              child: const Icon(Icons.notifications),
            ),
            onPressed: () {
              print("pressed");
              Overlay.of(context).insert(_createOverlayEntry());
            },
          );
        })
      ],
    );
  }
}

class NotificationItem extends GetView<NotificationsController> {
  final NotificationModel notification;
  final String id;

  const NotificationItem(this.id, this.notification, {super.key});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
          child: Container(
              padding: const EdgeInsets.all(2), // Padding inside the container
              margin: const EdgeInsets.all(2), // Margin around the container
              decoration: BoxDecoration(
                color: notification.read ?? false
                    ? null
                    : Colors.blue, // Background color
                borderRadius: BorderRadius.circular(2), // Rounded corners
                // border: const Border(
                //     bottom: BorderSide(
                //       color: Colors.black, // Border color
                //       width: 2, // Border width
                //     ),
                //     top: BorderSide.none,
                //     left: BorderSide.none,
                //     right: BorderSide.none),
                border: Border.all(
                  color: Colors.black, // Border color
                  width: 2, // Border width
                ),
              ),
              child: Column(
                children: [
                  Text(
                    notification.title ?? "No title.",
                  ),
                  Text(notification.description ?? "No description.")
                ],
              ))),
    ]);
  }
}
