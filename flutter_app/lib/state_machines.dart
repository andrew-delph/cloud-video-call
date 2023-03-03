import 'package:statemachine/statemachine.dart';

enum SocketStates { connecting, connected }

enum ChatStates { waiting, queued, connecting, feedback, error }

Machine<SocketStates> getSocketMachine() {
  Machine<SocketStates> socketMachine = Machine<SocketStates>();
  for (SocketStates stateVal in SocketStates.values) {
    var state = socketMachine.newState(stateVal);
    // state.onEntry(() {
    //   print("entered state" + stateVal.name);
    // });
  }
  return socketMachine;
}

Machine<ChatStates> getChatMachine() {
  Machine<ChatStates> chatMachine = Machine<ChatStates>();
  for (ChatStates stateVal in ChatStates.values) {
    var state = chatMachine.newState(stateVal);
    // state.onEntry(() {
    //   print("entered state" + stateVal.name);
    // });
  }

  // chatMachine.start();

  return chatMachine;
}
