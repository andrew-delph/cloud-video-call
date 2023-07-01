class NotificationModel {
  String? userId;
  String? time;
  String? title;
  String? description;
  bool? read;

  NotificationModel(
      {this.userId, this.time, this.title, this.description, this.read});

  NotificationModel.fromJson(Map<String, dynamic> json) {
    userId = json['userId'];
    time = json['time'];
    title = json['title'];
    description = json['description'];
    read = json['read'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['userId'] = userId;
    data['time'] = time;
    data['title'] = title;
    data['description'] = description;
    data['read'] = read;
    return data;
  }
}
