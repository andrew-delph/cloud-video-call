// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../models/history_model.dart';
import '../services/options_service.dart';

class HistoryController extends GetxController with StateMixin {
  final OptionsService optionsService;
  Rx<HistoryModel> historyModel = Rx(HistoryModel());
  RxBool unsavedChanges = false.obs;
  RxBool loading = false.obs;

  HistoryController(this.optionsService);

  @override
  onInit() async {
    super.onInit();
    await loadHistory();
  }

  loadHistory() async {
    change(null, status: RxStatus.loading());
    await optionsService
        .getHistory()
        .then((response) => historyModel(response.body))
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
}
