// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/models/notification_model.dart';
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
        .orderBy("time", descending: true)
        .limit(5)
        .snapshots();

    myNotificationsStream.listen((event) {
      for (var element in event.docChanges) {
        var notificationId = element.doc.id;
        var notificationData = element.doc.data();
        print("notification: ${notificationData?.title}");
        if (notificationData == null) continue;
        notifications[notificationId] = notificationData;
      }
    });

    var unreadStream = notificationCollection
        .where('userId', isEqualTo: userId)
        .where('read', isEqualTo: false)
        .snapshots();

    unreadStream.listen((event) {
      unread(event.size);
    });
  }

  addNotification() async {
    String userId = authService.getUser().uid;
    await notificationCollection.add(NotificationModel(
      userId: userId,
      title: "${DateTime.now().toString()}",
      time: DateTime.now().toString(),
      read: false,
    ));
  }

  readNotification(String id) async {
    notificationCollection.doc(id).update({"read": true});
  }

  DocumentReference<NotificationModel> getMyNotificationsDoc() {
    return notificationCollection.doc();
  }
}

class NotificationsButton extends GetView<NotificationsController> {
  const NotificationsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        PopupMenuButton<String>(
          icon: Obx(() => Badge(
                label: Text(controller.unread.toString()),
                isLabelVisible: controller.unread() > 0,
                child: const Icon(Icons.notifications),
              )),
          onSelected: (value) {
            controller.addNotification();
            controller.readNotification(value);
          },
          itemBuilder: (BuildContext context) => controller
              .notifications()
              .entries
              .map((entry) => PopupMenuItem<String>(
                    value: entry.key,
                    child: NotificationsItem(entry.value),
                  ))
              .toList(),
        )
      ],
    );
  }
}

class NotificationsItem extends GetView<NotificationsController> {
  final NotificationModel notification;

  const NotificationsItem(this.notification, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(notification.title ?? "No title."),
        Text(notification.description ?? "No description.")
      ],
    );
  }
}
