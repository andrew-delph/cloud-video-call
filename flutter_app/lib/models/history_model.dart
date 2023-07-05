class HistoryModel {
  List<HistoryItemModel> matchHistoryList = [];
  int total = 0;

  HistoryModel();

  HistoryModel.fromJson(dynamic json) {
    json['matchHistoryList'].forEach((v) {
      matchHistoryList.add(HistoryItemModel.fromJson(v));
    });
    total = json['total'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['matchHistoryList'] = matchHistoryList.map((v) => v.toJson()).toList();
    total = data['total'];
    return data;
  }
}

class HistoryItemModel {
  String? userId1;
  String? userId2;
  String? createTime;
  String? endTime;
  double? userId1Score;
  double? userId2Score;
  bool? friends;
  bool? negative;
  int? matchId;

  HistoryItemModel(
      {this.userId1,
      this.userId2,
      this.createTime,
      this.endTime,
      this.userId1Score,
      this.userId2Score});

  HistoryItemModel.fromJson(Map<String, dynamic> json) {
    userId1 = json['userId1'];
    userId2 = json['userId2'];
    createTime = json['createTime'];
    endTime = json['endTime'];
    userId1Score = json['userId1Score'];
    userId2Score = json['userId2Score'];
    friends = json['friends'];
    negative = json['negative'];
    matchId = json['matchId'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['userId1'] = userId1;
    data['userId2'] = userId2;
    data['createTime'] = createTime;
    data['endTime'] = endTime;
    data['userId1Score'] = userId1Score;
    data['userId2Score'] = userId2Score;
    data['friends'] = friends;
    data['negative'] = negative;
    data['matchId'] = matchId;
    return data;
  }
}
