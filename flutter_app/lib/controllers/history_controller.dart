// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../models/history_model.dart';
import '../models/user_model.dart';
import '../services/cache_service.dart';
import '../services/options_service.dart';

class HistoryController extends GetxController with StateMixin<HistoryModel> {
  final OptionsService optionsService;
  final CacheService cacheService = Get.find();
  Rx<HistoryModel> historyModel = Rx(HistoryModel());
  RxBool unsavedChanges = false.obs;
  RxBool loading = false.obs;

  RxList<HistoryItemModel> matchHistoryList = RxList();

  RxMap<int, HistoryItemModel> historyMap = RxMap();

  RxInt page = 0.obs;
  RxInt limit = 5.obs;
  RxInt total = 0.obs;

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

      historyMap.addEntries(body.matchHistoryList
          .where((historyItem) => historyItem.matchId != null)
          .map((historyItem) => MapEntry(historyItem.matchId!, historyItem)));

      List<HistoryItemModel> historyItemList = historyMap.values.toList();

      historyItemList
          .sort((a, b) => a.getCreateTime().compareTo(b.getCreateTime()));
      matchHistoryList(historyItemList);
      total(body.total);
    }).catchError((error) {
      change(null, status: RxStatus.error(error.toString()));
    });
  }

  Future loadMoreHistory() async {
    change(null, status: RxStatus.loading());
    return await optionsService
        .getHistory(matchHistoryList.length, 5)
        .then((body) async {
      if (body.matchHistoryList.isEmpty) {
        change(null, status: RxStatus.empty());
      } else {
        change(body, status: RxStatus.success());
      }

      historyMap.addEntries(body.matchHistoryList
          .where((historyItem) => historyItem.matchId != null)
          .map((historyItem) => MapEntry(historyItem.matchId!, historyItem)));

      List<HistoryItemModel> historyItemList = historyMap.values.toList();

      historyItemList
          .sort((a, b) => b.getCreateTime().compareTo(a.getCreateTime()));
      matchHistoryList(historyItemList);
      total(body.total);
    }).catchError((error) {
      change(null, status: RxStatus.error(error.toString()));
    });
  }

  updateFeedback(int matchId, int score) {
    final body = {'match_id': matchId, 'score': score};
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
