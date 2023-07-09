class UserDataModel {
  String? displayName;
  String? description;
  String? fcmToken;

  UserDataModel({this.displayName, this.description});

  UserDataModel.fromJson(Map<String, dynamic> json) {
    displayName = json['displayName'];
    description = json['description'];
    fcmToken = json['fcmToken'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['displayName'] = displayName;
    data['description'] = description;
    data['fcmToken'] = fcmToken;
    return data;
  }
}
