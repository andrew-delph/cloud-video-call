class ChatRoomModel {
  String? source;
  String? target;
  int? latestChat;
  bool? read;

  ChatRoomModel({this.source, this.target, this.latestChat, this.read});

  ChatRoomModel.fromJson(Map<String, dynamic> json) {
    source = json['source'];
    target = json['target'];
    latestChat = json['latestChat'];
    read = json['read'];
  }

  @override
  String toString() {
    return toJson().toString();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['source'] = source;
    data['target'] = target;
    data['latestChat'] = latestChat;
    data['read'] = read;
    return data;
  }
}
