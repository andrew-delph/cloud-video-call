class NotificationModel {
  String? userId;
  int? time;
  String? title;
  String? description;
  bool? read;
  bool? archive;

  NotificationModel(
      {this.userId,
      this.time,
      this.title,
      this.description,
      this.read,
      this.archive});

  NotificationModel.fromJson(Map<String, dynamic> json) {
    userId = json['userId'];
    time = json['time'];
    title = json['title'];
    description = json['description'];
    read = json['read'];
    archive = json['archive'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  bool isRead() {
    return read ?? false;
  }

  DateTime getDateTime() {
    var time = this.time;
    return time != null
        ? DateTime.fromMillisecondsSinceEpoch(time)
        : DateTime.now();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['userId'] = userId;
    data['time'] = time;
    data['title'] = title;
    data['description'] = description;
    data['read'] = read;
    data['archive'] = archive;
    return data;
  }
}
