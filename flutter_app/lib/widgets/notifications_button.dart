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
    overlay = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // This Positioned.fill covers the entire screen with a translucent color
          Positioned.fill(
            child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  overlay?.remove();
                },
                child: Container(color: Colors.transparent)),
          ),
          // The actual overlay content
          Positioned(
            top: 0,
            right: 0,
            bottom: 0,
            child: Material(
              color: Colors.transparent,
              child: Container(
                color: Colors.brown,
                child: Column(
                  children: [
                    const Text("!"),
                    TextButton(
                      onPressed: () {
                        print("PRESSESD");
                      },
                      child: const Text("testsajdksjdk"),
                    )
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
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
          return PopupMenuButton<String>(
            onSelected: (value) {
              if (value == "none") {
                // possible change to an empty string...
              } else if (value == "archive") {
                controller.archiveNotifications(controller
                    .notifications()
                    .entries
                    .map((entry) => entry.key)
                    .toList());
              } else {
                controller.archiveNotifications([value]);
              }
            },
            icon: Badge(
              label: Text(controller.unread.toString()),
              isLabelVisible: controller.unread() > 0,
              child: const Icon(Icons.notifications),
            ),
            itemBuilder: (BuildContext context) =>
                controller.loadNotifications(),
          );
        })
      ],
    );
  }
}

class NotificationsItem extends GetView<NotificationsController> {
  final NotificationModel notification;
  final String id;

  const NotificationsItem(this.id, this.notification, {super.key});

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
      // IconButton(
      //     onPressed: () {
      //       controller.archiveNotification(id);
      //       Navigator.pop(context);
      //     },
      //     icon: const Icon(Icons.close))
    ]);
  }
}

class NotificationsLoadMore extends GetView<NotificationsController> {
  const NotificationsLoadMore({super.key});

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: () {
        print("loading more");
        controller.addNotification();
      },
      child: const Text("Load More."),
    );
  }
}
