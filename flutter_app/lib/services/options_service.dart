// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/models/chat_room_model.dart';
import 'package:flutter_app/services/cache_service.dart';
import '../config/factory.dart';
import '../models/chat_event_model.dart';
import '../models/history_model.dart';
import '../models/preferences_model.dart';
import '../models/user_model.dart';
import '../utils/utils.dart';
import 'api_service.dart';
import 'auth_service.dart';

class OptionsService extends ApiService {
  final CacheService cacheService = Get.find();
  final AuthService authService = Get.find();
  OptionsService() {
    httpClient.baseUrl = Factory.getOptionsHost();
  }

  Future<dynamic> health() =>
      get('/health').then((response) => validateRequestGetBody(response));

  Future<Preferences> getPreferences() => get(
        '/preferences',
        contentType: 'application/json',
      ).then((response) =>
          validateRequestGetBody(response, decoder: Preferences.fromJson));

  Future<dynamic> updatePreferences(dynamic body) =>
      put('/preferences', body, contentType: 'application/json')
          .then((response) => validateRequestGetBody(response));

  Future<HistoryModel> getHistory(int skip, int limit) {
    Map<String, String> query = {"skip": "$skip", "limit": "$limit"};
    return get(
      '/history',
      query: query,
      contentType: 'application/json',
    ).then((response) =>
        validateRequestGetBody(response, decoder: HistoryModel.fromJson));
  }

  Future<HistoryItemModel> updateFeedback(dynamic body) => put(
          '/providefeedback', body, contentType: 'application/json')
      .then((response) =>
          validateRequestGetBody(response, decoder: HistoryItemModel.fromJson));

  CollectionReference<UserDataModel> getUserCollection() {
    return FirebaseFirestore.instance
        .collection('users')
        .withConverter<UserDataModel>(
          fromFirestore: (snapshots, _) =>
              UserDataModel.fromJson(snapshots.data()!),
          toFirestore: (userData, _) => userData.toJson(),
        );
  }

  Future<UserDataModel?> getUserData(String userId) async {
    return cacheService.getOrWrite<UserDataModel?>("user:data:$userId",
        () async {
      DocumentReference<UserDataModel> myUserDoc =
          getUserCollection().doc(userId);

      DocumentSnapshot<UserDataModel> snapshot = (await myUserDoc.get());

      if (!snapshot.exists) {
        return null;
      } else {
        return (await myUserDoc.get()).data();
      }
    });
  }

  DocumentReference<UserDataModel> getMyUserDataDoc() {
    String userId = authService.getUser().uid;
    DocumentReference<UserDataModel> myUserDoc =
        getUserCollection().doc(userId);
    return myUserDoc;
  }

  Future<List<ChatEventModel>> loadChat(String userId) => get(
        '/chat/$userId',
        contentType: 'application/json',
      ).then((response) => validateRequestGetBody(response, decoder: (body) {
            List<dynamic> chatMessages = body["chatMessages"] ?? [];
            return chatMessages.map((e) => ChatEventModel.fromJson(e)).toList();
          }));

  Future<List<ChatRoomModel>> loadChatRooms() => get(
        '/chat',
        contentType: 'application/json',
      ).then((response) => validateRequestGetBody(response, decoder: (body) {
            List<dynamic> chatRooms = body["chatRooms"] ?? [];
            return chatRooms.map((e) => ChatRoomModel.fromJson(e)).toList();
          }));
}
