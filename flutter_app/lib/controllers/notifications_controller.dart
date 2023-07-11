// Flutter imports:

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

class NotificationsController extends GetxController with StateMixin {
  final AuthService authService = Get.find();

  final OptionsService optionsService = Get.find();

  RxMap<String, NotificationModel> notifications = RxMap();

  RxList<MapEntry<String, NotificationModel>> notificationsList = RxList();

  RxSet<String> alreadySnackbar = RxSet();

  RxInt unread = (-1).obs;

  RxInt notificationTotal = (0).obs;

  QueryDocumentSnapshot<NotificationModel>? lastDocument;

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

    notifications.listen((p0) {
      sortNotifications();
    });

    authService.user.listen((user) async {
      if (user == null) {
        print("user not logged in. no notifications....");
        return;
      } else {
        print("listening to user notifications");
      }

      String userId = user.uid;

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

      getMyNotificationsStream().snapshots().listen((event) {
        notificationTotal(event.docs.length);
      });
    });

    Future<void> backgroundHandler(RemoteMessage message) async {
      print('Background message: ${message.data}');
    }

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');

      if (message.notification != null) {
        print('Message also contained a notification: ${message.notification}');
      }
    });
    FirebaseMessaging.onBackgroundMessage(backgroundHandler);
  }

  Query<NotificationModel> getMyNotificationsStream() {
    return notificationCollection
        .where('userId', isEqualTo: authService.getUser().uid)
        .where(
          'archive',
          isEqualTo: false,
        )
        .orderBy("time", descending: true);
  }

  Future<void> loadMoreNotifications() async {
    var myNotificationsStream = getMyNotificationsStream();
    if (lastDocument != null) {
      myNotificationsStream =
          myNotificationsStream.startAfterDocument(lastDocument!);
    }

    myNotificationsStream = myNotificationsStream.limit(5);

    if ((await myNotificationsStream.count().get()).count > 0) {
      lastDocument = (await myNotificationsStream.get()).docs.last;
      myNotificationsStream.snapshots().listen((event) {
        for (var element in event.docs) {
          var notificationId = element.id;
          var notificationData = element.data();
          notifications[notificationId] = notificationData;
        }
        // notifications.refresh();
      });
    }
  }

  void sortNotifications() {
    var notificationEntriestList = notifications.entries.toList();
    notificationEntriestList
        .sort((a, b) => a.value.getDateTime().compareTo(b.value.getDateTime()));
    notificationsList(notificationEntriestList);
  }

  Future<void> readNotifications(List<String> ids) async {
    WriteBatch batch = FirebaseFirestore.instance.batch();
    for (var id in ids) {
      batch.update(notificationCollection.doc(id), {"read": true});
      // print("readNotification $id");
      var temp = notifications[id];
      if (temp != null) {
        temp.read = true;
      }
    }
    await batch.commit();
  }

  Future<void> archiveNotifications(List<String> ids) async {
    WriteBatch batch = FirebaseFirestore.instance.batch();
    for (var id in ids) {
      batch.update(notificationCollection.doc(id), {"archive": true});
      // print("archiveNotification $id");
    }
    await batch.commit();
    for (var id in ids) {
      notifications.remove(id);
    }
  }

  DocumentReference<NotificationModel> getMyNotificationsDoc() {
    return notificationCollection.doc();
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
