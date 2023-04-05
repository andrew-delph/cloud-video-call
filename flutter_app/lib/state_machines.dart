import 'package:statemachine/statemachine.dart';

enum SocketStates { connecting, connected, established, error }

enum ChatStates {
  waiting,
  ready,
  matched,
  matchedError,
  connectionError,
  connected,
  ended,
  feedback,
  end,
  error
}

void stateChangeOnEntry(Machine machine, void Function() callback) {
  for (var state in machine.states) {
    machine[state.identifier].onEntry(callback);
  }
}

Machine<SocketStates> getSocketMachine() {
  Machine<SocketStates> socketMachine = Machine<SocketStates>();
  for (SocketStates stateVal in SocketStates.values) {
    var state = socketMachine.newState(stateVal);
    state.onEntry(() {
      print("socketMachine state: ${stateVal.name}");
    });
  }
  return socketMachine;
}

Machine<ChatStates> getChatMachine() {
  Machine<ChatStates> chatMachine = Machine<ChatStates>();
  for (ChatStates stateVal in ChatStates.values) {
    var state = chatMachine.newState(stateVal);
    state.onEntry(() {
      print("chatMachine state: ${stateVal.name}");
    });
  }

  return chatMachine;
}
