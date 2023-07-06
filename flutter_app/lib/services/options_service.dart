// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_app/models/chat_room_model.dart';

// Project imports:
import '../config/factory.dart';
import '../models/chat_event_model.dart';
import '../models/history_model.dart';
import '../models/preferences_model.dart';
import '../models/user_model.dart';
import '../utils/utils.dart';
import 'api_service.dart';

class OptionsService extends ApiService {
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

  Future<HistoryModel> getHistory(int page, int limit) {
    Map<String, String> query = {"page": "$page", "limit": "$limit"};
    return get(
      '/history',
      query: query,
      contentType: 'application/json',
    ).then((response) =>
        validateRequestGetBody(response, decoder: HistoryModel.fromJson));
  }

  Future<dynamic> updateFeedback(dynamic body) =>
      post('/providefeedback', body, contentType: 'application/json')
          .then((response) => validateRequestGetBody(response));

  Future<UserDataModel?> getUserData(String userId) async {
    CollectionReference<UserDataModel> myUserCollection = FirebaseFirestore
        .instance
        .collection('users')
        .withConverter<UserDataModel>(
          fromFirestore: (snapshots, _) =>
              UserDataModel.fromJson(snapshots.data()!),
          toFirestore: (userData, _) => userData.toJson(),
        );

    DocumentReference<UserDataModel> myUserDoc = myUserCollection.doc(userId);

    UserDataModel? userData = (await myUserDoc.get()).data();

    return userData;
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
            print("chatRooms loaded");
            print(chatRooms);
            return chatRooms.map((e) => ChatRoomModel.fromJson(e)).toList();
          }));
}
