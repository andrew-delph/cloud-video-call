// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get/get.dart';

// Project imports:
import '../models/history_model.dart';
import '../models/user_model.dart';
import '../services/options_service.dart';
import '../utils/utils.dart';

class HistoryController extends GetxController with StateMixin {
  final OptionsService optionsService;
  Rx<HistoryModel> historyModel = Rx(HistoryModel());
  RxBool unsavedChanges = false.obs;
  RxBool loading = false.obs;

  RxInt page = 0.obs;

  RxInt limit = 5.obs;

  HistoryController(this.optionsService);

  @override
  onInit() async {
    super.onInit();
    await loadHistory();

    page.listen((p0) async {
      await loadHistory();
    });
  }

  loadHistory() async {
    change(null, status: RxStatus.loading());
    await optionsService
        .getHistory(page(), limit())
        .then((body) => historyModel(body))
        .then((_) {
      if (historyModel().matchHistoryList.isEmpty) {
        change(null, status: RxStatus.empty());
      } else {
        change(null, status: RxStatus.success());
      }
    }).catchError((error) {
      print("history error: $error");
      change(null, status: RxStatus.error(error.toString()));
    });
  }

  updateFeedback(int feedbackId, int score) {
    final body = {'feedback_id': feedbackId, 'score': score};
    return optionsService.updateFeedback(body).catchError((error) {
      print("history error: $error");
      change(null, status: RxStatus.error(error.toString()));
    }).then((value) => loadHistory());
  }

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

  void nextPage() {
    if (historyModel().matchHistoryList.isNotEmpty) {
      page(page() + 1);
    }
  }

  void prevPage() {
    var currentPage = page();
    if (currentPage > 0) {
      page(currentPage - 1);
    }
  }
}
