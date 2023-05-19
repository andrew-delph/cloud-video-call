class HistoryModel {
  List<HistoryItemModel> matchHistoryList = [];

  HistoryModel();

  factory HistoryModel.fromJson(dynamic json) {
    HistoryModel history = HistoryModel();
    if (json['matchHistoryList'] != null) {
      json['matchHistoryList'].forEach((v) {
        history.matchHistoryList.add(HistoryItemModel.fromJson(v));
      });
    }
    return history;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['matchHistoryList'] = matchHistoryList.map((v) => v.toJson()).toList();
    return data;
  }
}

class HistoryItemModel {
  String? userId1;
  String? userId2;
  String? createTime;
  double? userId1Score;
  double? userId2Score;

  HistoryItemModel(
      {this.userId1,
      this.userId2,
      this.createTime,
      this.userId1Score,
      this.userId2Score});

  HistoryItemModel.fromJson(Map<String, dynamic> json) {
    userId1 = json['userId1'];
    userId2 = json['userId2'];
    createTime = json['createTime'];
    userId1Score = json['userId1Score'];
    userId2Score = json['userId2Score'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['userId1'] = userId1;
    data['userId2'] = userId2;
    data['createTime'] = createTime;
    data['userId1Score'] = userId1Score;
    data['userId2Score'] = userId2Score;
    return data;
  }
}
