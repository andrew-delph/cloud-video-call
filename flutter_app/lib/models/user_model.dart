class UserDataModel {
  String? displayName;
  String? description;
  String? fcm;

  UserDataModel({this.displayName, this.description});

  UserDataModel.fromJson(Map<String, dynamic> json) {
    displayName = json['displayName'];
    description = json['description'];
    fcm = json['fcm'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['displayName'] = displayName;
    data['description'] = description;
    data['fcm'] = fcm;
    return data;
  }
}
