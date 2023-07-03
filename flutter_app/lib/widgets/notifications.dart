// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/models/notification_model.dart';
import 'package:flutter_app/utils/utils.dart';
import '../services/auth_service.dart';

class NotificationsController extends GetxController with StateMixin {
  final AuthService authService = Get.find();

  RxMap<String, NotificationModel> notifications = RxMap();

  RxInt unread = 0.obs;

  CollectionReference<NotificationModel> notificationCollection =
      FirebaseFirestore.instance
          .collection('notifications')
          .withConverter<NotificationModel>(
            fromFirestore: (snapshots, _) =>
                NotificationModel.fromJson(snapshots.data()!),
            toFirestore: (userData, _) => userData.toJson(),
          );

  @override
  onInit() {
    super.onInit();
    print("init NotificationsController");
    String userId = authService.getUser().uid;
    var myNotificationsStream = notificationCollection
        .where('userId', isEqualTo: userId)
        .where(
          'archive',
          isEqualTo: false,
        )
        .orderBy("time", descending: true)
        .limit(5)
        .snapshots();

    myNotificationsStream.listen((event) {
      notifications.clear();
      for (var element in event.docs) {
        var notificationId = element.id;
        var notificationData = element.data();
        notifications[notificationId] = notificationData;
      }
    });

    var unreadStream = notificationCollection
        .where('userId', isEqualTo: userId)
        .where(
          'read',
          isEqualTo: false,
        )
        .where(
          'archive',
          isEqualTo: false,
        )
        .snapshots();

    unreadStream.listen((event) {
      unread(event.size);
      for (var element in event.docChanges) {
        infoSnackbar("Notification", "${element.doc.data()?.title}");
      }
    });
  }

  addNotification() async {
    String userId = authService.getUser().uid;
    await notificationCollection.add(NotificationModel(
      userId: userId,
      title: DateTime.now().toString(),
      time: DateTime.now().toString(),
      read: false,
      archive: false,
    ));
  }

  readNotification(String id) async {
    print("readNotification $id");
    notificationCollection.doc(id).update({"read": true});
  }

  archiveNotification(String id) async {
    print("archiveNotification $id");
    notificationCollection.doc(id).update({"archive": true});
  }

  DocumentReference<NotificationModel> getMyNotificationsDoc() {
    return notificationCollection.doc();
  }

  List<PopupMenuItem<String>> loadNotifications() {
    print("loadNotifications");
    var popups = notifications().entries.map((entry) {
      if (!(entry.value.isRead())) {
        readNotification(entry.key);
      }

      return PopupMenuItem<String>(
        value: entry.key,
        child: NotificationsItem(entry.key, entry.value),
      );
    }).toList();

    if (popups.isEmpty) {
      popups.add(const PopupMenuItem<String>(
        value: "load_more",
        child: Text("No Notifications."),
      ));
    } else {
      popups.add(const PopupMenuItem<String>(
        value: "load_more",
        child: NotificationsLoadMore(),
      ));
    }

    return popups;
  }
}

class NotificationsButton extends GetView<NotificationsController> {
  const NotificationsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Obx(() {
          print("calling the build thing");
          return PopupMenuButton<String>(
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
          child: Column(
        children: [
          Text(notification.title ?? "No title."),
          Text(notification.description ?? "No description.")
        ],
      )),
      IconButton(
          onPressed: () {
            controller.archiveNotification(id);
            Navigator.pop(context);
          },
          icon: const Icon(Icons.close))
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
