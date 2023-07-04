class ChatEventModel {
  String? source;
  String? target;
  String? message;

  ChatEventModel({
    this.source,
    this.target,
    this.message,
  });

  ChatEventModel.fromJson(Map<String, dynamic> json) {
    source = json['source'];
    target = json['target'];
    message = json['message'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['source'] = source;
    data['target'] = target;
    data['message'] = message;
    return data;
  }
}
