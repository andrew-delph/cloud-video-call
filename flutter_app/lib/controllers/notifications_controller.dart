// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:get/get.dart';

// Project imports:
import '../models/notification_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/options_service.dart';
import '../utils/utils.dart';
import '../widgets/notifications_button.dart';

class NotificationsController extends GetxController with StateMixin {
  final AuthService authService = Get.find();

  final OptionsService optionsService = Get.find();

  RxMap<String, NotificationModel> notifications = RxMap();

  RxSet<String> alreadySnackbar = RxSet();

  RxInt unread = (-1).obs;

  CollectionReference<NotificationModel> notificationCollection =
      FirebaseFirestore.instance
          .collection('notifications')
          .withConverter<NotificationModel>(
            fromFirestore: (snapshots, _) =>
                NotificationModel.fromJson(snapshots.data()!),
            toFirestore: (userData, _) => userData.toJson(),
          );

  @override
  onInit() async {
    super.onInit();
    print("init NotificationsController");

    authService.user.listen((user) {
      if (user == null) {
        print("user not logged in. no notifications....");
        return;
      } else {
        print("listening to user notifications");
      }
      String userId = user.uid;
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
        if (unread() >= 0) {
          for (var element in event.docChanges) {
            var notification = element.doc.data();
            if (!(notification?.read ?? false) &&
                !alreadySnackbar().contains(element.doc.id)) {
              infoSnackbar("Notification", "${notification?.title}");
            }
          }
        }
        for (var element in event.docChanges) {
          alreadySnackbar.add(element.doc.id);
        }
        unread(event.size);
      });
    });

    Future<void> _backgroundHandler(RemoteMessage message) async {
      print('Background message: ${message.data}');
    }

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');

      if (message.notification != null) {
        print('Message also contained a notification: ${message.notification}');
      }
    });
    FirebaseMessaging.onBackgroundMessage(_backgroundHandler);
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

  readNotifications(List<String> ids) async {
    WriteBatch batch = FirebaseFirestore.instance.batch();
    for (var id in ids) {
      batch.update(notificationCollection.doc(id), {"read": true});
      print("readNotification $id");
    }
    await batch.commit();
  }

  archiveNotifications(List<String> ids) async {
    WriteBatch batch = FirebaseFirestore.instance.batch();
    for (var id in ids) {
      batch.update(notificationCollection.doc(id), {"archive": true});
      print("archiveNotification $id");
    }
    await batch.commit();
  }

  DocumentReference<NotificationModel> getMyNotificationsDoc() {
    return notificationCollection.doc();
  }

  List<PopupMenuItem<String>> loadNotifications() {
    print("loadNotifications");
    var popups = notifications().entries.map((entry) {
      return PopupMenuItem<String>(
        value: entry.key,
        child: NotificationsItem(entry.key, entry.value),
      );
    }).toList();

    readNotifications(notifications()
        .entries
        .where((entry) => !entry.value.isRead())
        .map((entry) => entry.key)
        .toList());

    if (popups.isEmpty) {
      popups.add(const PopupMenuItem<String>(
        value: "none",
        child: Text("No Notifications."),
      ));
    } else {
      popups.add(const PopupMenuItem<String>(
        value: "archive",
        child: Text("Archive Notifications."),
      ));
    }

    return popups;
  }

  Future<NotificationSettings> getNotificationSettings() async {
    return await FirebaseMessaging.instance.getNotificationSettings();
  }

  Future<bool> isFcmEnabled() async {
    bool authorized = (await getNotificationSettings()).authorizationStatus ==
        AuthorizationStatus.authorized;
    if (!authorized) return authorized;
    DocumentReference<UserDataModel> myUserDataDoc =
        optionsService.getMyUserDataDoc();

    var userData = (await myUserDataDoc.get()).data();
    return userData?.fcmToken != null;
  }

  Future<void> disableFcm() async {
    DocumentReference<UserDataModel> myUserDataDoc =
        optionsService.getMyUserDataDoc();

    await myUserDataDoc.update({"fcmToken": FieldValue.delete()});
    // delete from firestore
  }

  Future<void> enableFcm() async {
    FirebaseMessaging.instance.setAutoInitEnabled(true);
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    String? fcmToken = await getToken();

    if (fcmToken == null) return;

    DocumentReference<UserDataModel> myUserDataDoc =
        optionsService.getMyUserDataDoc();

    await myUserDataDoc.update({"fcmToken": fcmToken});

    // add to firestore
  }

  Future<String?> getToken() async {
    return await FirebaseMessaging.instance
        .getToken(
            vapidKey:
                "BG0aaA4iE8mJpvjk5XFmX8CcP5cab5fUk_FBMYPQmAKmHd5kumpd9TcYePrpHvOB-aLkr8lGWI0WkRI6M9xGEvg")
        .catchError((err) {
      print("GET TOKEN ERROR: $err");
      return null;
    });
  }
}
