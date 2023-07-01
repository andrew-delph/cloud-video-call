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
    var myNotificationsStream =
        notificationCollection.where('userId', isEqualTo: userId).snapshots();

    myNotificationsStream.listen((event) {
      for (var element in event.docChanges) {
        var notificationId = element.doc.id;
        var notificationData = element.doc.data();
        if (notificationData == null) continue;
        notifications[notificationId] = notificationData;
      }
    });
  }

  addNotification() async {
    String userId = authService.getUser().uid;
    await notificationCollection.add(NotificationModel(
        userId: userId, title: "testing!", time: DateTime.now().toString()));
  }

  DocumentReference<NotificationModel> getMyNotificationsDoc() {
    return notificationCollection.doc();
  }
}

class NotificationsButton extends GetView<NotificationsController> {
  const NotificationsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
        icon: const Icon(Icons.notifications),
        itemBuilder: (BuildContext context) => controller
            .notifications()
            .entries
            .map((entry) => PopupMenuItem<String>(
                  value: entry.key,
                  child: NotificationsItem(entry.value),
                ))
            .toList());
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
