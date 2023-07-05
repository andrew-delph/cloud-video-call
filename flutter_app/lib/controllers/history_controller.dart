// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../models/history_model.dart';
import '../models/user_model.dart';
import '../services/options_service.dart';

class HistoryController extends GetxController with StateMixin<HistoryModel> {
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
  }

  Future loadHistory() async {
    change(null, status: RxStatus.loading());
    return await optionsService.getHistory(page(), limit()).then((body) async {
      if (body.matchHistoryList.isEmpty) {
        change(null, status: RxStatus.empty());
      } else {
        change(body, status: RxStatus.success());
      }
      historyModel(body);
    }).catchError((error) {
      change(null, status: RxStatus.error(error.toString()));
    });
  }

  updateFeedback(int feedbackId, int score) {
    final body = {'feedback_id': feedbackId, 'score': score};
    return optionsService
        .updateFeedback(body)
        .then((value) => loadHistory())
        .catchError((error) {
      print("history error: $error");
      change(null, status: RxStatus.error(error.toString()));
    });
  }

  Future<UserDataModel?> getUserData(String userId) async {
    return optionsService.getUserData(userId);
  }

  Future<void> nextPage() async {
    int current = (page() + 1) * limit();

    if (historyModel().matchHistoryList.isNotEmpty &&
        current < historyModel().total) {
      page(page() + 1);
      await loadHistory();
    }
  }

  Future<void> prevPage() async {
    var currentPage = page();
    if (currentPage > 0) {
      page(currentPage - 1);
      await loadHistory();
    }
  }
}
