class UserDataModel {
  String? displayName;
  String? description;

  UserDataModel({this.displayName, this.description});

  UserDataModel.fromJson(Map<String, dynamic> json) {
    displayName = json['displayName'];
    description = json['description'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['displayName'] = displayName;
    data['description'] = description;
    return data;
  }
}
